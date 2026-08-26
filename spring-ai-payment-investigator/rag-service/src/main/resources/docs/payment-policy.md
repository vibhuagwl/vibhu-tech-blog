# Payment Policy

Outbound NEFT/RTGS payments must pass beneficiary validation before settlement.

## Beneficiary validation (BEN-001)

- **Code**: BEN-001 / BENEFICIARY_INVALID
- **Meaning**: Beneficiary account number, IFSC, or name mismatch with bank records.
- **Action**: Do **not** retry with the same beneficiary details. Ask customer to verify account/IFSC.
- **Investigation**: After 3 failed retries, automatically create an investigation case.

## Amount thresholds

- Payments above ₹200,000 require enhanced beneficiary verification.
- Failed high-value payments escalate to support within 4 hours.
