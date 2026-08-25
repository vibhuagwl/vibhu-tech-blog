# HSBC Payment Runbook

## Incident: BANK_TIMEOUT spike

1. Check HSBC status page and internal circuit-breaker metrics.
2. Query failed payments with `failureCode=BANK_TIMEOUT` and `bank=HSBC`.
3. Verify Kafka `payments.outbound` consumer lag.
4. If HSBC confirms recovery, replay failed messages after OPS approval.

## PAY-123 reference case

Payment PAY-123 for customer CUST-100 failed with BANK_TIMEOUT. Retry is allowed per policy.
