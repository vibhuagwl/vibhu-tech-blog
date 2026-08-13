package com.vibhu.hadron.service;

import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.exception.InvalidCashLineException;
import com.vibhu.hadron.exception.PoisonMessageException;
import com.vibhu.hadron.exception.TransientTechnicalException;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class CashLineValidator {

  private static final Set<String> CURRENCIES = Set.of("USD", "EUR", "GBP", "INR");
  private static final Set<String> PARTICIPANTS = Set.of("P-NEPTUNE", "P-HADRON", "P-BANK");
  private static final Set<String> ACCOUNTS = Set.of("ACC-1001", "ACC-2002", "ACC-3003");
  private static final Set<String> TX_TYPES = Set.of("DRAWDOWN", "REPAYMENT", "FEE", "ADJUSTMENT");

  public void validate(CashLineEvent event) {
    applyForcedFailure(event);
    if (event.eventId() == null || event.eventId().isBlank()) {
      throw new InvalidCashLineException("Missing mandatory field eventId");
    }
    if (event.cashLineId() == null || event.cashLineId().isBlank()) {
      throw new InvalidCashLineException("Missing mandatory field cashLineId");
    }
    if (event.eventType() == null) {
      throw new InvalidCashLineException("Invalid transaction state / event type");
    }
    if (event.participantId() == null || !PARTICIPANTS.contains(event.participantId())) {
      throw new InvalidCashLineException("Invalid or unknown participant: " + event.participantId());
    }
    if (event.accountId() == null || !ACCOUNTS.contains(event.accountId())) {
      throw new InvalidCashLineException("Invalid account: " + event.accountId());
    }
    if (event.currency() == null || !CURRENCIES.contains(event.currency().toUpperCase(Locale.ROOT))) {
      throw new InvalidCashLineException("Invalid currency: " + event.currency());
    }
    if (event.amount() == null || event.amount().compareTo(BigDecimal.ZERO) <= 0) {
      throw new InvalidCashLineException("Invalid amount: " + event.amount());
    }
    if (event.transactionType() != null && !TX_TYPES.contains(event.transactionType())) {
      throw new InvalidCashLineException("Unsupported transaction type: " + event.transactionType());
    }
  }

  private void applyForcedFailure(CashLineEvent event) {
    String force = event.forceFailure();
    switch (force) {
      case "POISON" -> throw new PoisonMessageException("Forced poison payload for event " + event.eventId());
      case "TIMEOUT", "DB_TIMEOUT" ->
          throw new TransientTechnicalException("Forced database timeout for event " + event.eventId());
      case "DEADLOCK" -> throw new TransientTechnicalException("Forced deadlock for event " + event.eventId());
      case "UNKNOWN_PARTICIPANT" ->
          throw new TransientTechnicalException("Unknown participant reference, waiting for master data");
      case "NPE" -> throw new NullPointerException("Forced NPE for interview demo");
      default -> {
        // no-op
      }
    }
  }
}
