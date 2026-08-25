package com.vibhu.aifp.common;

public record UserContext(String userId, Role role, String tenantId) {
  public static UserContext support(String userId) {
    return new UserContext(userId, Role.SUPPORT, "TENANT-1");
  }

  public static UserContext ops(String userId) {
    return new UserContext(userId, Role.OPS, "TENANT-1");
  }
}
