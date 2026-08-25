# Payment Error Codes

| Code | Bank | Description | Retry |
|------|------|-------------|-------|
| BANK_TIMEOUT | HSBC | Gateway SLA breach | Yes |
| INSUFFICIENT_FUNDS | Any | Debit account balance low | No |
| INVALID_ACCOUNT | Any | Beneficiary account closed | No |

BANK_TIMEOUT indicates a transient network or gateway issue — cite runbook `hsbc-payment-runbook` before retry.
