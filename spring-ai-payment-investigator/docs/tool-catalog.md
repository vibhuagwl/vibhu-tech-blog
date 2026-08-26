# Tool Catalog

All tools route through `ToolGateway` → `ToolAuthorizationService` → audit.

| Tool | Permission | Risk | AI (SUPPORT) |
|------|------------|------|--------------|
| getPayment | payment.read | READ | ✅ |
| getPaymentHistory | payment.read | READ | ✅ |
| getBankResponse | payment.read | READ | ✅ |
| getPaymentRetryHistory | payment.read | READ | ✅ |
| getCustomerPaymentProfile | payment.read | READ | ✅ |
| getPaymentStatus | payment.read | READ | ✅ |
| searchPaymentPolicy | policy.read | READ | ✅ |
| getRelatedKafkaEvents | kafka.read | READ | ✅ |
| createInvestigationCase | investigation.create | WRITE | ✅ (creates case) |
| payment.execute | payment.execute | WRITE | ❌ **blocked** |

## HITL actions

- `payment.execute` — always denied for AI role
- `payment.retry` — requires human approval via `/api/ai/approvals`
