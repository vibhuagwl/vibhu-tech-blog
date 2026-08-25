package com.vibhu.fai.common.security;

/**
 * ============================================================
 * INTERVIEW NOTES — Authorization
 * ============================================================
 * Prompt instructions are NOT authorization.
 * LLM says "get payment X"; Java decides "is this user allowed?".
 * Memory: authz lives in tools/services, never in the prompt alone.
 * ============================================================
 */
public record AuthContext(String tenantId, String userId, String role) {

  public static AuthContext demo() {
    return new AuthContext("TENANT-1", "user-demo", "ANALYST");
  }
}
