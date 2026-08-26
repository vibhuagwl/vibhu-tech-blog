# Payment Retry Policy

Failed outbound payments may be retried when `retryAllowed=true` on the payment record.

## General rules

- **Maximum retries**: 3 attempts per payment
- **Backoff**: 30 seconds, 2 minutes, 10 minutes between attempts
- After the **third failed retry**, set `retryAllowed=false` and create an investigation case

## BEN-001 (Beneficiary Invalid)

- **Do not retry** — beneficiary details must be corrected first
- After 3 attempts with BEN-001, escalate to manual investigation
- Support agent should contact customer to verify beneficiary account/IFSC

## BANK_TIMEOUT

- Safe to retry up to 3 times with exponential backoff
- Monitor bank SLA before retry

## Approval

Retries above ₹200,000 require OPS approval.
