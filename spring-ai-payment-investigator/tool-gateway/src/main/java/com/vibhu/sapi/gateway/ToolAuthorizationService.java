package com.vibhu.sapi.gateway;

import com.vibhu.sapi.enums.Role;
import com.vibhu.sapi.enums.ToolRisk;
import com.vibhu.sapi.exception.UnauthorizedToolException;
import com.vibhu.sapi.security.UserContext;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ToolAuthorizationService {

    private final ToolCatalog toolCatalog;

    public ToolAuthorizationService(ToolCatalog toolCatalog) {
        this.toolCatalog = toolCatalog;
    }

    public void authorize(UserContext user, String toolName) {
        ToolDefinition def = toolCatalog.get(toolName);
        if (def == null) {
            throw new UnauthorizedToolException("Unknown tool: " + toolName);
        }
        if ("payment.execute".equals(toolName)) {
            throw new UnauthorizedToolException("AI role cannot invoke payment.execute — HITL required");
        }
        if (def.risk() == ToolRisk.WRITE && user.role() == Role.SUPPORT) {
            throw new UnauthorizedToolException("Role SUPPORT cannot invoke write tool: " + toolName);
        }
        if (!user.hasPermission(def.permission())) {
            throw new UnauthorizedToolException("Missing permission " + def.permission() + " for " + toolName);
        }
    }

    public Set<String> allowedToolsFor(UserContext user) {
        return toolCatalog.allToolNames()
                .stream()
                .filter(name -> {
                    try {
                        authorize(user, name);
                        return true;
                    } catch (UnauthorizedToolException ex) {
                        return false;
                    }
                })
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isWriteTool(String toolName) {
        return toolCatalog.isWriteTool(toolName);
    }
}
