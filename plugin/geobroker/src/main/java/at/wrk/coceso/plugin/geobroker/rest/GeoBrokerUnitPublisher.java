package at.wrk.coceso.plugin.geobroker.rest;

import at.wrk.coceso.plugin.geobroker.contract.GeoBrokerUnit;

/**
 * Publishes the provided updates to the external REST interface.
 */
public interface GeoBrokerUnitPublisher {
    /**
     * Informs the external GeoBroker about the updated unit in gebroker format.
     */
    void unitUpdated(GeoBrokerUnit updatedUnit);

    /**
     * Informs the external GeoBroker about the deleted unit with the given identifier.
     */
    void unitDeleted(String externalUnitId);
}
