package com.vibhu.aifp.assistant.security;

import com.vibhu.aifp.common.Role;
import com.vibhu.aifp.common.UserContext;

public final class UserContextHolder {
  private static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();

  private UserContextHolder() {}

  public static void set(UserContext context) {
    CTX.set(context);
  }

  public static UserContext get() {
    UserContext ctx = CTX.get();
    return ctx == null ? UserContext.support("anonymous") : ctx;
  }

  public static void clear() {
    CTX.remove();
  }

  public static Role parseRole(String roleHeader) {
    if (roleHeader == null || roleHeader.isBlank()) {
      return Role.SUPPORT;
    }
    return Role.valueOf(roleHeader.trim().toUpperCase());
  }
}
