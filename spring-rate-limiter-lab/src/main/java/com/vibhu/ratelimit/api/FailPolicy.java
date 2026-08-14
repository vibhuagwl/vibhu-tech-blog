package com.vibhu.ratelimit.api;

/**
 * What to do when the distributed store is unavailable.
 *
 * <ul>
 *   <li>{@link #FAIL_OPEN} — allow the request (availability over protection).</li>
 *   <li>{@link #FAIL_CLOSED} — reject the request (protection over availability).</li>
 *   <li>{@link #LOCAL_FALLBACK} — enforce an in-process token bucket (approximate).</li>
 * </ul>
 */
public enum FailPolicy {
  FAIL_OPEN,
  FAIL_CLOSED,
  LOCAL_FALLBACK
}
