package com.vibhu.ratelimit.api;

/**
 * Isolation boundary for a quota. A request is evaluated against every matching policy (global →
 * tenant → client → user → API → IP → service).
 */
public enum RateLimitScope {
  GLOBAL,
  TENANT,
  CLIENT,
  USER,
  API,
  IP,
  SERVICE,
  CLIENT_API,
  TENANT_API
}
