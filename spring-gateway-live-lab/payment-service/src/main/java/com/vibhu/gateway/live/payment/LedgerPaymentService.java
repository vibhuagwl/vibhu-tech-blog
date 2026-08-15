package com.vibhu.gateway.live.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * In-memory ledger demo for interview: one synchronized critical section = "ACID debit/credit".
 * Real banking would use a DB transaction / ledger service — same fail-closed rules apply.
 */
@Service
public class LedgerPaymentService {

  private final Object ledgerLock = new Object();
  private final Map<Long, BigDecimal> balances = new ConcurrentHashMap<>();
  private final Map<String, PaymentRecord> byIdempotencyKey = new ConcurrentHashMap<>();
  private final Map<String, PaymentRecord> byPaymentId = new ConcurrentHashMap<>();

  public LedgerPaymentService() {
    balances.put(1001L, new BigDecimal("1000.00"));
    balances.put(1002L, new BigDecimal("500.00"));
  }

  public PaymentRecord pay(String idempotencyKey, PaymentRequest request) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key header required");
    }
    if (request.fromAccountId().equals(request.toAccountId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from and to must differ");
    }

    // Fast path: prior result for same key (safe client retry)
    PaymentRecord existing = byIdempotencyKey.get(idempotencyKey);
    if (existing != null) {
      return existing;
    }

    synchronized (ledgerLock) {
      PaymentRecord raced = byIdempotencyKey.get(idempotencyKey);
      if (raced != null) {
        return raced;
      }

      BigDecimal fromBal = balances.get(request.fromAccountId());
      BigDecimal toBal = balances.get(request.toAccountId());
      if (fromBal == null || toBal == null) {
        return storeRejected(idempotencyKey, request, "unknown account");
      }
      if (fromBal.compareTo(request.amount()) < 0) {
        return storeRejected(idempotencyKey, request, "insufficient funds");
      }

      // Strong consistency: both sides update or neither (single lock = demo TX)
      balances.put(request.fromAccountId(), fromBal.subtract(request.amount()));
      balances.put(request.toAccountId(), toBal.add(request.amount()));

      PaymentRecord settled =
          new PaymentRecord(
              "pay_" + UUID.randomUUID(),
              idempotencyKey,
              request.fromAccountId(),
              request.toAccountId(),
              request.amount(),
              PaymentStatus.SETTLED,
              balances.get(request.fromAccountId()),
              "ledger committed",
              Instant.now());
      byIdempotencyKey.put(idempotencyKey, settled);
      byPaymentId.put(settled.paymentId(), settled);
      return settled;
    }
  }

  public Optional<PaymentRecord> find(String paymentId) {
    return Optional.ofNullable(byPaymentId.get(paymentId));
  }

  public Map<Long, BigDecimal> balancesSnapshot() {
    return Map.copyOf(balances);
  }

  private PaymentRecord storeRejected(String key, PaymentRequest request, String reason) {
    PaymentRecord rejected =
        new PaymentRecord(
            "pay_" + UUID.randomUUID(),
            key,
            request.fromAccountId(),
            request.toAccountId(),
            request.amount(),
            PaymentStatus.REJECTED,
            balances.getOrDefault(request.fromAccountId(), BigDecimal.ZERO),
            reason,
            Instant.now());
    byIdempotencyKey.put(key, rejected);
    byPaymentId.put(rejected.paymentId(), rejected);
    return rejected;
  }
}
