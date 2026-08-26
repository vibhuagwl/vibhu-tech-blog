package com.vibhu.sapi.gateway;

import com.vibhu.sapi.enums.ToolRisk;

public record ToolDefinition(
    String name,
    String description,
    String permission,
    ToolRisk risk,
    boolean requiresApproval) {}
