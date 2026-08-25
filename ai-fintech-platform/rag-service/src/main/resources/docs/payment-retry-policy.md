# Payment Retry Policy

Failed outbound payments may be retried when `retryAllowed=true` on the payment record.

## BANK_TIMEOUT (HSBC)

- **Meaning**: HSBC gateway did not respond within the 30s SLA.
- **Action**: Safe to retry up to 3 times with exponential backoff (30s, 2m, 10m).
- **Do not retry** if fraud screening flagged the payment.

## Approval

Retries above £10,000 require OPS approval.
