package at.wrk.coceso.service.impl;

import at.wrk.coceso.entity.Concern;
import at.wrk.coceso.entity.Incident;
import at.wrk.coceso.entity.Patient;
import at.wrk.coceso.entity.Unit;
import at.wrk.coceso.entity.User;
import at.wrk.coceso.entity.enums.Errors;
import at.wrk.coceso.entity.enums.IncidentState;
import at.wrk.coceso.entity.enums.IncidentType;
import at.wrk.coceso.entity.enums.LogEntryType;
import at.wrk.coceso.entity.enums.TaskState;
import at.wrk.coceso.entity.helper.Changes;
import at.wrk.coceso.entity.point.Point;
import at.wrk.coceso.entity.point.UnitPoint;
import at.wrk.coceso.entityevent.impl.NotifyList;
import at.wrk.coceso.exceptions.ErrorsException;
import at.wrk.coceso.repository.IncidentRepository;
import at.wrk.coceso.service.LogService;
import at.wrk.coceso.service.UnitService;
import at.wrk.coceso.service.hooks.HookService;
import at.wrk.coceso.service.internal.IncidentServiceInternal;
import at.wrk.coceso.service.internal.PatientServiceInternal;
import at.wrk.coceso.service.internal.TaskServiceInternal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
class IncidentServiceImpl implements IncidentServiceInternal {

  private final static Logger LOG = LoggerFactory.getLogger(IncidentServiceImpl.class);

  private final static Sort SORT = new Sort(Sort.Direction.ASC, "id");

  @Autowired
  private IncidentRepository incidentRepository;

  @Autowired
  private TaskServiceInternal taskService;

  @Autowired
  private HookService hookService;

  @Autowired
  private LogService logService;

  @Autowired
  private PatientServiceInternal patientService;

  @Autowired
  private UnitService unitService;

  @Override
  public Incident getById(int id) {
    return incidentRepository.findOne(id);
  }

  @Override
  public List<Incident> getAll(Concern concern) {
    return incidentRepository.findByConcern(concern);
  }

  @Override
  public List<Incident> getAllSorted(Concern concern) {
    return incidentRepository.findByConcern(concern, SORT);
  }

  @Override
  public List<Incident> getAllRelevant(Concern concern) {
    return incidentRepository.findRelevant(concern);
  }

  @Override
  public List<Incident> getAllForReport(Concern concern) {
    return incidentRepository.findNonSingleUnit(concern, SORT);
  }

  @Override
  public List<Incident> getAllForDump(Concern concern) {
    return incidentRepository.findActiveNonSingleUnit(concern, SORT);
  }

  @Override
  public List<Incident> getAllTransports(Concern concern) {
    return incidentRepository.findTransports(concern, SORT);
  }

  @Override
  public List<Incident> getAllActive(Concern concern) {
    return incidentRepository.findActive(concern, SORT);
  }

  @Override
  public Map<Incident, TaskState> getRelated(Unit unit) {
    return incidentRepository.findByIdIn(incidentRepository.findRelated(unit)).stream().collect(Collectors.toMap(
        Function.identity(), i -> i.getUnits().getOrDefault(unit, TaskState.Detached)));
  }

  @Override
  public Incident update(Incident incident, Concern concern, User user, NotifyList notify) {
    Map<Unit, TaskState> units = incident.getUnits();

    Changes changes = new Changes("incident");
    if (incident.getId() == null) {
      incident = incidentRepository.saveAndFlush(prepareForCreate(incident, concern, changes, user));
      logService.logAuto(user, LogEntryType.INCIDENT_CREATE, incident.getConcern(), null, incident, changes);
      notify.add(incident);
    } else {
      incident = prepareForUpdate(incident, changes, user);
      if (!changes.isEmpty()) {
        incident = incidentRepository.saveAndFlush(incident);
        logService.logAuto(user, LogEntryType.INCIDENT_UPDATE, incident.getConcern(), null, incident, changes);
        notify.add(incident);
      }
    }

    if (incident.getState().isDone()) {
      hookService.callIncidentDone(incident, user, notify);
    } else if (units != null) {
      final Incident i = incident;
      units.forEach((unit, state) -> taskService.changeState(i, unitService.getById(unit.getId()), state, user, notify));
    }

    return incident;
  }

  @Override
  public Incident createHoldPosition(Point position, Unit unit, TaskState state, User user, NotifyList notify) {
    Incident hold = new Incident();
    hold.setState(IncidentState.InProgress);
    hold.setType(IncidentType.HoldPosition);
    hold.setAo(position);

    hold = update(hold, unit.getConcern(), user, notify);
    taskService.changeState(hold, unit, state, user, notify);

    return hold;
  }

  @Override
  public void endTreatments(Patient patient, User user, NotifyList notify) {
    if (patient != null && patient.getIncidents() != null) {
      patient.getIncidents().stream()
          .filter(i -> i.getType() == IncidentType.Treatment && !i.getState().isDone())
          .forEach(i -> {
            Changes changes = new Changes("incident");
            changes.put("state", i.getState(), IncidentState.Done);
            i.setState(IncidentState.Done);

            i = incidentRepository.saveAndFlush(i);
            logService.logAuto(user, LogEntryType.INCIDENT_AUTO_DONE, i.getConcern(), null, i, changes);
            notify.add(i);

            hookService.callIncidentDone(i, user, notify);
          });
    }
  }

  @Override
  public Incident createTreatment(Patient patient, Unit group, User user, NotifyList notify) {
    Changes changes = new Changes("incident");

    if (!patient.getConcern().equals(group.getConcern())) {
      throw new ErrorsException(Errors.ConcernMismatch);
    }

    Incident incident = new Incident();

    incident.setPatient(patient);
    incident.setConcern(patient.getConcern());

    changes.put("state", null, IncidentState.InProgress);
    incident.setState(IncidentState.InProgress);

    changes.put("ao", null, group.getCall());
    incident.setAo(new UnitPoint(group.getId()));

    changes.put("type", null, IncidentType.Treatment);
    incident.setType(IncidentType.Treatment);

    if (group.getSection() != null) {
      incident.setSection(group.getSection());
    }

    incident = incidentRepository.saveAndFlush(incident);
    logService.logAuto(user, LogEntryType.INCIDENT_CREATE, incident.getConcern(), null, incident, changes);
    notify.add(incident);

    taskService.uncheckedChangeState(incident, group, TaskState.AAO, user, notify);
    logService.logAuto(user, LogEntryType.UNIT_ASSIGN, incident.getConcern(), group, incident, TaskState.AAO);

    return incident;
  }

  @Override
  public void assignPatient(int incidentId, int patientId, User user, NotifyList notify) {
    Incident incident = getById(incidentId);
    Patient patient = patientService.getByIdNoLog(patientId);
    assignPatient(incident, patient, user, notify);
  }

  @Override
  public void assignPatient(Incident incident, Patient patient, User user, NotifyList notify) {
    if (incident == null || patient == null) {
      throw new ErrorsException(Errors.EntityMissing);
    }

    if (!incident.getConcern().equals(patient.getConcern())) {
      throw new ErrorsException(Errors.ConcernMismatch);
    }

    if (Concern.isClosed(incident.getConcern())) {
      throw new ErrorsException(Errors.ConcernMissingOrClosed);
    }

    incident.setPatient(patient);
    incident = incidentRepository.saveAndFlush(incident);
    logService.logAuto(user, LogEntryType.PATIENT_ASSIGN, incident.getConcern(), incident, patient);
    notify.add(incident);
  }

  private Incident prepareForCreate(Incident incident, Concern concern, Changes changes, User user) {
    LOG.info("{}: Triggered incident create", user);

    if (Concern.isClosed(concern)) {
      LOG.warn("{}: Tried to create incident without open concern", user);
      throw new ErrorsException(Errors.ConcernClosed);
    }

    Incident save = new Incident();

    // Set updated properties
    save.setConcern(concern);

    if (incident.getState() != null) {
      changes.put("state", null, incident.getState());
      save.setState(incident.getState());
    }

    if (incident.isPriority()) {
      changes.put("priority", null, true);
      save.setPriority(true);
    }

    if (incident.isBlue()) {
      changes.put("blue", null, true);
      save.setBlue(true);
    }

    Point bo = Point.create(incident.getBo(), concern);
    if (!Point.isEmpty(bo)) {
      changes.put("bo", null, bo.toString());
      save.setBo(bo);
    }

    Point ao = Point.create(incident.getAo(), concern);
    if (!Point.isEmpty(ao)) {
      changes.put("ao", null, ao.toString());
      save.setAo(ao);
    }

    if (StringUtils.isNotBlank(incident.getCasusNr())) {
      changes.put("casusNr", null, incident.getCasusNr());
      save.setCasusNr(incident.getCasusNr());
    }

    if (StringUtils.isNotBlank(incident.getInfo())) {
      changes.put("info", null, incident.getInfo());
      save.setInfo(incident.getInfo());
    }

    if (StringUtils.isNotBlank(incident.getCaller())) {
      changes.put("caller", null, incident.getCaller());
      save.setCaller(incident.getCaller());
    }

    changes.put("type", null, incident.getType());
    save.setType(incident.getType());

    if (incident.getSection() == null || !save.getConcern().containsSection(incident.getSection())) {
      save.setSection(null);
    } else {
      changes.put("section", null, incident.getSection());
      save.setSection(incident.getSection());
    }

    return save;
  }

  private Incident prepareForUpdate(Incident incident, Changes changes, User user) {
    LOG.info("{}: Triggered update of incident {}", user, incident);

    Incident save = getById(incident.getId());
    if (save == null) {
      // Incident missing, should be checked by validator!
      throw new ErrorsException(Errors.EntityMissing);
    }

    if (save.getConcern().isClosed()) {
      LOG.warn("{}: Tried to update incident {} in closed concern", user, incident);
      throw new ErrorsException(Errors.ConcernClosed);
    }

    // Set updateable properties
    if (incident.getState() != null && incident.getState() != save.getState()) {
      changes.put("state", save.getState(), incident.getState());
      save.setState(incident.getState());
    }

    if (incident.isPriority() != save.isPriority()) {
      changes.put("priority", save.isPriority(), incident.isPriority());
      save.setPriority(incident.isPriority());
    }

    if (incident.isBlue() != save.isBlue()) {
      changes.put("blue", save.isBlue(), incident.isBlue());
      save.setBlue(incident.isBlue());
    }

    Point bo = Point.create(incident.getBo(), save.getConcern());
    if (!Point.infoEquals(bo, save.getBo())) {
      changes.put("bo", Point.toStringOrNull(save.getBo()), Point.toStringOrNull(bo));
      save.setBo(bo);
    }

    Point ao = Point.create(incident.getAo(), save.getConcern());
    if (!Point.infoEquals(ao, save.getAo())) {
      changes.put("ao", Point.toStringOrNull(save.getAo()), Point.toStringOrNull(ao));
      save.setAo(ao);
    }

    if (!Objects.equals(save.getCasusNr(), incident.getCasusNr())) {
      changes.put("casusNr", save.getCasusNr(), incident.getCasusNr());
      save.setCasusNr(incident.getCasusNr());
    }

    if (!Objects.equals(save.getInfo(), incident.getInfo())) {
      changes.put("info", save.getInfo(), incident.getInfo());
      save.setInfo(incident.getInfo());
    }

    if (!Objects.equals(save.getCaller(), incident.getCaller())) {
      changes.put("caller", save.getCaller(), incident.getCaller());
      save.setCaller(incident.getCaller());
    }

    if (!Objects.equals(save.getType(), incident.getType())) {
      changes.put("type", save.getType(), incident.getType());
      save.setType(incident.getType());
    }

    if (incident.getSection() == null || !save.getConcern().containsSection(incident.getSection())) {
      if (save.getSection() != null) {
        changes.put("section", save.getSection(), null);
        save.setSection(null);
      }
    } else if (!incident.getSection().equals(save.getSection())) {
      changes.put("section", save.getSection(), incident.getSection());
      save.setSection(incident.getSection());
    }

    return save;
  }

}
