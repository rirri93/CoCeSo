package at.wrk.coceso.entities;

import java.sql.Timestamp;

public class LogEntry {

    public int id;

    public Case aCase;

    public Timestamp timestamp;

    public Unit unit;

    public Incident incident;

    public TaskState state;


    public boolean autoGenerated;

    public Person user;

    public String text;

    public String json;

    // GETTER
    public Timestamp getTimestamp() {
        return timestamp;
    }

    public Unit getUnit() {
        return unit;
    }

    public Incident getIncident() {
        return incident;
    }

    public TaskState getState() {
        return state;
    }

    public boolean isAutoGenerated() {
        return autoGenerated;
    }

    public Person getUser() {
        return user;
    }

    public String getText() {
        return text;
    }

    public String getJson() {
        return json;
    }

}
