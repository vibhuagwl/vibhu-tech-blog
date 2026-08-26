package com.vibhu.sapi.gateway;

import com.vibhu.sapi.gateway.audit.ToolAuditService;
import com.vibhu.sapi.security.UserContext;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Service
public class ToolGateway {

    private final ToolAuthorizationService authorizationService;
    private final ToolAuditService auditService;

    public ToolGateway(
            ToolAuthorizationService authorizationService, ToolAuditService auditService) {
        this.authorizationService = authorizationService;
        this.auditService = auditService;
    }

    public <T> T invoke(UserContext user, String toolName, String arguments, Supplier<T> action) {
        authorizationService.authorize(user, toolName);
        long t0 = System.currentTimeMillis();
        try {
            T result = action.get();
            auditService.record(
                    auditService.build(
                            toolName,
                            arguments,
                            summarize(result),
                            user.userId(),
                            user.role()
                                    .name(),
                            true,
                            System.currentTimeMillis() - t0));
            return result;
        } catch (RuntimeException ex) {
            auditService.record(
                    auditService.build(
                            toolName,
                            arguments,
                            ex.getMessage(),
                            user.userId(),
                            user.role()
                                    .name(),
                            false,
                            System.currentTimeMillis() - t0));
            throw ex;
        }
    }

    private static String summarize(Object result) {
        if (result == null) {
            return "null";
        }
        String s = result.toString();
        return s.length() > 500 ? s.substring(0, 500) + "..." : s;
    }
}
