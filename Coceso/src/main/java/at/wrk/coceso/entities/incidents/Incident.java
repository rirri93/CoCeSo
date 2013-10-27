package at.wrk.coceso.entities.incidents;


import at.wrk.coceso.entities.*;

import java.util.*;

public class Incident {
    public int id;

    public Case aCase;

    public IncidentState state;

    public int priority;

    public boolean blue;

    public Map<Unit, TaskState> units;

    public CocesoPOI bo;

    public CocesoPOI ao;

    public String casusNumber;  //TODO

    public String info;

    public String caller;


}
