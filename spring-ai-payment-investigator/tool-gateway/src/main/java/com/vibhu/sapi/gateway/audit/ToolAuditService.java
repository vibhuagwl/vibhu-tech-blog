package com.vibhu.sapi.gateway.audit;

import com.vibhu.sapi.dto.ToolCallAudit;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class ToolAuditService {

    private final List<ToolCallAudit> audits = Collections.synchronizedList(new ArrayList<>());

    public void record(ToolCallAudit audit) {
        audits.add(audit);
    }

    public List<ToolCallAudit> all() {
        return List.copyOf(audits);
    }

    public long count() {
        return audits.size();
    }

    public void clear() {
        audits.clear();
    }

    public ToolCallAudit build(String toolName, String arguments, String resultSummary, String userId, String role,
            boolean success, long durationMs) {
        return new ToolCallAudit(toolName, arguments, resultSummary, userId, role, success, durationMs, Instant.now());
    }
}
