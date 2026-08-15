package com.vibhu.msp.resilience;

import java.util.function.Function;
import java.util.function.Supplier;

/** Fallback service — degrade gracefully when primary fails. */
public final class FallbackService {

  public <T> T withFallback(Supplier<T> primary, Function<Exception, T> fallback) {
    try {
      return primary.get();
    } catch (Exception ex) {
      return fallback.apply(ex);
    }
  }

  public <T> T withStaticFallback(Supplier<T> primary, T fallbackValue) {
    return withFallback(primary, ex -> fallbackValue);
  }
}
