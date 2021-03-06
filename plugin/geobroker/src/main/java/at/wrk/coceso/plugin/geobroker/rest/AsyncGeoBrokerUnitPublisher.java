package at.wrk.coceso.plugin.geobroker.rest;

import at.wrk.coceso.plugin.geobroker.contract.GeoBrokerUnit;
import com.fatboyindustrial.gsonjavatime.Converters;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.web.client.AsyncRestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

import static at.wrk.coceso.plugin.geobroker.rest.HttpEntities.createHttpEntityForJsonString;

@Component
@PropertySource(value = "classpath:geobroker.properties", ignoreResourceNotFound = true)
public class AsyncGeoBrokerUnitPublisher implements GeoBrokerUnitPublisher {
    private static final Logger LOG = LoggerFactory.getLogger(AsyncGeoBrokerUnitPublisher.class);

    private final AsyncRestTemplate restTemplate;
    private final String privateApiUrl;
    private final Gson gson;

    private final Map<String, GeoBrokerUnit> unitCache;

    @Autowired
    public AsyncGeoBrokerUnitPublisher(
            final AsyncRestTemplate restTemplate,
            final @Value("${geobroker.private.api.url}") String privateApiUrl) {
        this.restTemplate = restTemplate;
        this.privateApiUrl = privateApiUrl;
        this.gson = Converters.registerAll(new GsonBuilder()).create();

        this.unitCache = new ConcurrentHashMap<>();
        restTemplate.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    @Override
    public void unitUpdated(final GeoBrokerUnit updatedUnit) {
        GeoBrokerUnit previousValue = unitCache.put(updatedUnit.getId(), updatedUnit);
        if (!Objects.equals(previousValue, updatedUnit)) {
            publishUnitUpdate(updatedUnit);
        } else {
            LOG.debug("Unit was not changed since last update. Publishing is skipped. unitId={}", updatedUnit.getId());
        }
    }

    @Override
    public void unitDeleted(final String externalUnitId) {
        GeoBrokerUnit removedUnit = unitCache.remove(externalUnitId);
        if (removedUnit != null) {
            publishUnitDeletion(externalUnitId);
        } else {
            LOG.debug("Unit was not published to GeoBroker before. Deletion is skipped. unitId={}", externalUnitId);
        }
    }

    private void publishUnitDeletion(final String externalUnitId) {
        String url = getUrlForUnit(externalUnitId);
        ListenableFuture<?> future = restTemplate.delete(url);
        future.addCallback(
                success -> LOG.debug("Successfully deleted unit at geobroker url: '{}'", url),
                failure -> LOG.warn("Failed to delete unit at geobroker url: '{}'.", url));
    }

    private void publishUnitUpdate(final GeoBrokerUnit updatedUnit) {
        String url = getUrlForUnit(updatedUnit.getId());
        HttpEntity<String> httpEntity = serializeUnit(updatedUnit);
        putHttpEntityToUrl(url, httpEntity);
    }

    private HttpEntity<String> serializeUnit(final GeoBrokerUnit updatedUnit) {
        String unitJson = gson.toJson(updatedUnit);
        return createHttpEntityForJsonString(unitJson);
    }

    private String getUrlForUnit(final String externalUnitId) {
        return privateApiUrl + "/units/" + externalUnitId;
    }

    private void putHttpEntityToUrl(final String url, final HttpEntity<String> httpEntity) {
        ListenableFuture<ResponseEntity<String>> responseFuture = restTemplate.exchange(url, HttpMethod.PUT, httpEntity, String.class);
        responseFuture.addCallback(
                success -> LOG.debug("Successfully written updated unit to geobroker url: '{}'", url),
                failure -> LOG.warn("Failed to update unit at geobroker url: '{}'.", url));
    }
}
