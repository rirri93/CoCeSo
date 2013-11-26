package at.wrk.coceso.entities;


import at.wrk.coceso.entities.*;

import java.util.*;

public class Incident {

    private static HashMap<IncidentType, List<TaskState>> possibleStates;

    static {
        possibleStates = new HashMap<IncidentType, List<TaskState>>();
        List<TaskState> tmp = new ArrayList<TaskState>();

        tmp.add(TaskState.Assigned);
        tmp.add(TaskState.AAO);
        tmp.add(TaskState.Detached);

        possibleStates.put(IncidentType.HoldPosition, new ArrayList<TaskState>(tmp));
        possibleStates.put(IncidentType.Standby, new ArrayList<TaskState>(tmp));

        tmp.add(1, TaskState.ZAO);

        possibleStates.put(IncidentType.Relocation, new ArrayList<TaskState>(tmp));

        tmp.add(1, TaskState.ZBO);
        tmp.add(2, TaskState.ABO);

        possibleStates.put(IncidentType.Task, new ArrayList<TaskState>(tmp));
    }

    public int id;

    public Case aCase;

    public IncidentState state;

    public int priority;

    public boolean blue;

    public Map<Integer, TaskState> units;

    public CocesoPOI bo;

    public CocesoPOI ao;

    public String casusNr;

    public String info;

    public String caller;

    public IncidentType type;

    public TaskState nextState(Unit unit) {
        if(state == null || type == null || unit == null || !units.containsKey(unit.id))
            return null;

        List<TaskState> l = possibleStates.get(type);
        if(l == null)
            return null;
        int index = l.indexOf(units.get(unit.id));
        if(index < 0 || index > l.size() - 2)
            return null;

        TaskState ret = l.get(index+1);

        units.put(unit.id, ret);

        if(type == IncidentType.HoldPosition || type == IncidentType.Standby) {
            if(ret == TaskState.Detached)
                state = IncidentState.Done;
            if(ret == TaskState.AAO)
                state = IncidentState.Working;
        } else {
            if(ret == TaskState.Detached)
                units.remove(unit.id);
        }


        return ret;
    }
}
