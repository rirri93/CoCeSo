package at.wrk.coceso.controller.patadmin;

import at.wrk.coceso.entity.Concern;
import at.wrk.coceso.entity.Patient;
import at.wrk.coceso.entity.Unit;
import at.wrk.coceso.entity.User;
import at.wrk.coceso.entity.helper.JsonViews;
import at.wrk.coceso.entity.helper.SequencedResponse;
import at.wrk.coceso.entityevent.EntityEventFactory;
import at.wrk.coceso.entityevent.EntityEventHandler;
import at.wrk.coceso.service.patadmin.PatadminService;
import at.wrk.coceso.service.patadmin.RegistrationService;
import at.wrk.coceso.utils.ActiveConcern;
import at.wrk.coceso.utils.Initializer;
import com.fasterxml.jackson.annotation.JsonView;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/data/patadmin/registration", method = RequestMethod.GET)
public class RegistrationRestController {

  @Autowired
  private PatadminService patadminService;

  @Autowired
  private RegistrationService registrationService;

  private final EntityEventHandler<Unit> entityEventHandler;

  @Autowired
  public RegistrationRestController(EntityEventFactory eehf) {
    this.entityEventHandler = eehf.getEntityEventHandler(Unit.class);
  }

  @PreAuthorize("@auth.hasPermission(#concern, 'PatadminRegistration')")
  @Transactional
  @JsonView(JsonViews.Patadmin.class)
  @RequestMapping(value = "patients", produces = "application/json", method = RequestMethod.GET)
  public List<Patient> getPatients(@RequestParam("f") String f, @RequestParam("q") String q, @ActiveConcern Concern concern, @AuthenticationPrincipal User user) {
    return Initializer.initGroups(registrationService.getForAutocomplete(concern, q, f, user));
  }

  @PreAuthorize("@auth.hasPermission(#concern, 'PatadminRegistration')")
  @Transactional
  @JsonView(JsonViews.Patadmin.class)
  @RequestMapping(value = "groups", produces = "application/json", method = RequestMethod.GET)
  public SequencedResponse<List<Unit>> getGroups(@ActiveConcern Concern concern) {
    return new SequencedResponse<>(entityEventHandler.getHver(), entityEventHandler.getSeq(concern.getId()),
        Initializer.init(patadminService.getGroups(concern), Unit::getIncidents));
  }

}
