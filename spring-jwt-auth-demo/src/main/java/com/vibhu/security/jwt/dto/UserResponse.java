package com.vibhu.security.jwt.dto;

import java.util.Set;

public record UserResponse(Long id, String email, Set<String> roles, boolean enabled) {}
