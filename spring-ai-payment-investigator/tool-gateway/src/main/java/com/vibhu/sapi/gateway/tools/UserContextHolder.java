package com.vibhu.sapi.gateway.tools;

import com.vibhu.sapi.security.UserContext;

public final class UserContextHolder {

  private static final ThreadLocal<UserContext> CONTEXT = new ThreadLocal<>();

  private UserContextHolder() {}

  public static void set(UserContext user) {
    CONTEXT.set(user);
  }

  public static UserContext get() {
    UserContext ctx = CONTEXT.get();
    return ctx == null ? UserContext.demo() : ctx;
  }

  public static void clear() {
    CONTEXT.remove();
  }
}
