package com.vibhu.sapi.security;

import com.vibhu.sapi.enums.Role;

public record UserContext(String userId, Role role, String tenantId) {

  public static UserContext support(String userId) {
    return new UserContext(userId, Role.SUPPORT, "TENANT-1");
  }

  public static UserContext ops(String userId) {
    return new UserContext(userId, Role.OPS, "TENANT-1");
  }

  public static UserContext demo() {
    return support("demo-support");
  }

  public boolean hasPermission(String permission) {
    if (role == Role.ADMIN) {
      return true;
    }
    if (role == Role.OPS) {
      return !permission.equals("payment.admin");
    }
    return permission.startsWith("payment.read")
        || permission.startsWith("policy.read")
        || permission.startsWith("kafka.read")
        || permission.startsWith("investigation.create");
  }
}
