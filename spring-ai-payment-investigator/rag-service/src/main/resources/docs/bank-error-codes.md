# Bank Error Codes

Reference for BANK-ABC NEFT/RTGS responses.

| Code | Name | Retry? | Description |
|------|------|--------|-------------|
| BEN-001 | BENEFICIARY_INVALID | No | Beneficiary account validation failed |
| BEN-002 | BENEFICIARY_CLOSED | No | Beneficiary account closed |
| TMOUT-001 | BANK_TIMEOUT | Yes | Bank gateway timeout within SLA |
| INSUF-001 | INSUFFICIENT_FUNDS | No | Debit account insufficient balance |

## BEN-001 detail

Bank returns `businessCode=BEN-001` with message "Beneficiary account validation failed".
This is a **hard failure** — retrying with identical beneficiary data will fail again.
