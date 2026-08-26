# Payment Investigation Runbook

## TXN failure triage (support)

1. **Fetch payment** — confirm status, amount, rail, bank
2. **Review history** — CREATED → VALIDATED → SUBMITTED → RETRY_* → FAILED
3. **Check bank response** — note businessCode and message
4. **Review retry count** — if retryCount >= 3, do not auto-retry
5. **Search policy** — match error code to runbook action
6. **Create investigation case** — when max retries exhausted

## BEN-001 playbook

- Root cause: beneficiary account validation failed at BANK-ABC
- Evidence: bank response BEN-001, 3 retry attempts with same error
- Recommended actions:
  - Ask customer to verify beneficiary account number and IFSC
  - Do not execute or retry payment until details corrected
  - Create investigation case if not already open
- Human approval required for any payment.execute or payment.retry

## Escalation

Escalate to OPS if amount > ₹500,000 or customer risk tier is HIGH.
