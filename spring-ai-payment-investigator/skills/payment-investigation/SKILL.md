# Payment Investigation Skill

Use this skill when investigating failed outbound payments (NEFT/RTGS).

## Workflow

1. Extract payment ID (TXN-*) from user message
2. Call tools in order: getPayment → getPaymentHistory → getBankResponse → getPaymentRetryHistory → searchPaymentPolicy
3. Assemble `PaymentInvestigation` JSON from tool results — never invent facts
4. If retryCount >= 3, set humanApprovalRequired=true and recommend investigation case
5. Never call payment.execute — escalate to human approver

## Seed scenario TXN-1001

- Amount: ₹250,000 INR, NEFT, BANK-ABC
- Status: FAILED, failureCode BEN-001
- 3 retries exhausted

## Tool docs

See `tools/` subdirectory for per-tool reference.
