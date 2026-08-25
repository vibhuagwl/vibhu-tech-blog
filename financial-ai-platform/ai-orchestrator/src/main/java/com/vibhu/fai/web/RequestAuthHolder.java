package com.vibhu.fai.web;

import com.vibhu.fai.common.security.AuthContext;

public final class RequestAuthHolder {
  private static final ThreadLocal<AuthContext> AUTH = new ThreadLocal<>();
  private static final ThreadLocal<String> CONV = new ThreadLocal<>();

  private RequestAuthHolder() {}

  public static void set(AuthContext auth, String conversationId) {
    AUTH.set(auth);
    CONV.set(conversationId);
  }

  public static AuthContext get() {
    AuthContext a = AUTH.get();
    return a != null ? a : AuthContext.demo();
  }

  public static String conversationId() {
    String c = CONV.get();
    return c != null ? c : "unknown";
  }

  public static void clear() {
    AUTH.remove();
    CONV.remove();
  }
}
