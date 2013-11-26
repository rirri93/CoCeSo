package at.wrk.coceso.dao;

import at.wrk.coceso.dao.mapper.LogMapper;
import at.wrk.coceso.entities.LogEntry;
import at.wrk.coceso.entities.TaskState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Repository;
import sun.reflect.generics.reflectiveObjects.NotImplementedException;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class LogDao extends CocesoDao<LogEntry> {

    // REFERENCES NOT RESOLVED BY THIS MAPPER
    @Autowired
    LogMapper logMapper;

    @Autowired
    public LogDao(DataSource dataSource) {
        super(dataSource);
    }

    @Override
    public LogEntry getById(int id) {
        if(id <= 0) return null;

        String q = "SELECT * FROM log l LEFT OUTER JOIN persons p ON l.uzer = p.id WHERE l.id = ?";

        try {
            return jdbc.queryForObject(q, new Object[] {id}, logMapper);
        } catch(DataAccessException e) {
            return null;
        }
    }

    public List<LogEntry> getByUnitId(int id) {
        if(id <= 0) return null;

        String q = "SELECT * FROM log l LEFT OUTER JOIN persons p ON l.uzer = p.id WHERE l.unit = ?";

        return jdbc.query(q, new Object[]{id}, logMapper);
    }

    public List<LogEntry> getByIncidentId(int id) {
        if(id <= 0) return null;

        String q = "SELECT * FROM log l LEFT OUTER JOIN persons p ON l.uzer = p.id WHERE l.incident = ?";

        return jdbc.query(q, new Object[] {id}, logMapper);
    }


    @Override
    public List<LogEntry> getAll(int id) {
        if(id <= 0) return null;

        String q = "SELECT * FROM log l LEFT OUTER JOIN persons p ON l.uzer = p.id WHERE l.acase = ?";

        return jdbc.query(q, new Object[] {id}, logMapper);
    }

    @Override
    public boolean update(LogEntry logEntry) {
        throw new NotImplementedException();
    }

    @Override
    public boolean add(LogEntry l) {
        String q = "INSERT INTO log (timestamp, acase, unit, incident, taskstate, autogenerated, " +
                "uzer, text, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        TaskState state = null;
        if(l.incident != null && l.unit != null && l.incident.units != null) {
            state = l.incident.units.get(l.unit.id);
        }

        jdbc.update(q, new Timestamp(System.currentTimeMillis()), l.aCase.id, l.unit == null ? null : l.unit.id,
                l.incident == null ? null : l.incident.id, state == null ? null : state.name(),
                l.autoGenerated, l.user.id, l.text, l.json);

        return true;
    }

    @Override
    public boolean remove(LogEntry logEntry) {
        throw new NotImplementedException();
    }
}
