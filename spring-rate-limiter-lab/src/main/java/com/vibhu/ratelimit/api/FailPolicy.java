package com.vibhu.ratelimit.api;

/**
 * What to do when the distributed store is unavailable.
 *
 * <ul>
 *   <li>{@link #FAIL_OPEN} — allow the request (availability over protection).
 *   <li>{@link #FAIL_CLOSED} — reject the request (protection over availability).
 *   <li>{@link #LOCAL_FALLBACK} — enforce an in-process token bucket (approximate).
 * </ul>
 */
public enum FailPolicy {
  FAIL_OPEN,
  FAIL_CLOSED,
  LOCAL_FALLBACK
}
