package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineStatus;
import com.vibhu.hadron.domain.EventType;
import com.vibhu.hadron.exception.IllegalStateTransitionException;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class CashLineStateMachine {

  private static final Map<EventType, CashLineStatus> TARGET =
      new EnumMap<>(EventType.class);

  private static final Map<CashLineStatus, Set<CashLineStatus>> ALLOWED =
      new EnumMap<>(CashLineStatus.class);

  static {
    TARGET.put(EventType.CASHLINE_CREATED, CashLineStatus.VALIDATED);
    TARGET.put(EventType.CASHLINE_VALIDATED, CashLineStatus.VALIDATED);
    TARGET.put(EventType.CASHLINE_UPDATED, CashLineStatus.PROCESSING);
    TARGET.put(EventType.CASHLINE_PROCESSING, CashLineStatus.PROCESSED);
    TARGET.put(EventType.CASHLINE_SETTLED, CashLineStatus.SETTLED);
    TARGET.put(EventType.CASHLINE_COMPLETED, CashLineStatus.COMPLETED);
    TARGET.put(EventType.CASHLINE_CANCELLED, CashLineStatus.CANCELLED);

    ALLOWED.put(CashLineStatus.NEW, EnumSet.of(CashLineStatus.VALIDATED, CashLineStatus.CANCELLED));
    ALLOWED.put(
        CashLineStatus.VALIDATED,
        EnumSet.of(CashLineStatus.PROCESSING, CashLineStatus.PROCESSED, CashLineStatus.CANCELLED));
    ALLOWED.put(
        CashLineStatus.PROCESSING,
        EnumSet.of(CashLineStatus.PROCESSED, CashLineStatus.SETTLED, CashLineStatus.CANCELLED));
    ALLOWED.put(CashLineStatus.PROCESSED, EnumSet.of(CashLineStatus.SETTLED, CashLineStatus.CANCELLED));
    ALLOWED.put(CashLineStatus.SETTLED, EnumSet.of(CashLineStatus.COMPLETED));
    ALLOWED.put(CashLineStatus.COMPLETED, EnumSet.of(CashLineStatus.COMPLETED));
    ALLOWED.put(CashLineStatus.CANCELLED, EnumSet.of(CashLineStatus.CANCELLED));
    ALLOWED.put(CashLineStatus.RETRY, EnumSet.of(CashLineStatus.VALIDATED, CashLineStatus.PROCESSING));
    ALLOWED.put(CashLineStatus.DLQ, EnumSet.noneOf(CashLineStatus.class));
    ALLOWED.put(CashLineStatus.MANUAL_REVIEW, EnumSet.noneOf(CashLineStatus.class));
  }

  public CashLineStatus next(CashLineStatus current, EventType eventType) {
    CashLineStatus from = current == null ? CashLineStatus.NEW : current;
    CashLineStatus to = TARGET.get(eventType);
    if (to == null) {
      throw new IllegalStateTransitionException("Unsupported event type " + eventType);
    }
    if (from == to) {
      return from;
    }
    Set<CashLineStatus> allowed = ALLOWED.getOrDefault(from, Set.of());
    if (!allowed.contains(to)) {
      throw new IllegalStateTransitionException("Illegal transition " + from + " -> " + to + " via " + eventType);
    }
    return to;
  }
}
