package com.vibhu.gateway.live.payment;

/** Money movement statuses — gateway fallback must NEVER invent SETTLED. */
public enum PaymentStatus {
  /** Accepted into the ledger transaction boundary (strong consistency). */
  SETTLED,
  /** Explicit business reject (insufficient funds, bad request). */
  REJECTED,
  /** Downstream/platform unavailable — fail closed; client may retry with same idempotency key. */
  FAILED_CLOSED
}
