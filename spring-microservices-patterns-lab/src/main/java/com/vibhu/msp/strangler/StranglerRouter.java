package com.vibhu.msp.strangler;

import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;

/**
 * Strangler Fig router — gradually shifts traffic from legacy to new implementation. Maps to
 * curriculum Part 01 (Strangler Fig) and Part 02 (Gateway routing).
 */
public final class StranglerRouter<T, R> {

  public sealed interface RouteTarget permits RouteTarget.Legacy, RouteTarget.NewService {
    record Legacy() implements RouteTarget {}

    record NewService() implements RouteTarget {}
  }

  private final int newServicePercent;
  private final Function<T, R> legacyHandler;
  private final Function<T, R> newHandler;

  public StranglerRouter(
      int newServicePercent, Function<T, R> legacyHandler, Function<T, R> newHandler) {
    if (newServicePercent < 0 || newServicePercent > 100) {
      throw new IllegalArgumentException("Percent must be 0-100");
    }
    this.newServicePercent = newServicePercent;
    this.legacyHandler = legacyHandler;
    this.newHandler = newHandler;
  }

  public RouteTarget selectTarget() {
    int roll = ThreadLocalRandom.current().nextInt(100);
    return roll < newServicePercent ? new RouteTarget.NewService() : new RouteTarget.Legacy();
  }

  public R route(T request) {
    return switch (selectTarget()) {
      case RouteTarget.Legacy() -> legacyHandler.apply(request);
      case RouteTarget.NewService() -> newHandler.apply(request);
    };
  }

  public R routeTo(RouteTarget target, T request) {
    return switch (target) {
      case RouteTarget.Legacy() -> legacyHandler.apply(request);
      case RouteTarget.NewService() -> newHandler.apply(request);
    };
  }
}
