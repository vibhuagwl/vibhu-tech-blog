export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'payment-e2e',
    title: 'Payment E2E',
    endpoint: 'POST /api/payments -> payment-process.bpmn',
    classes: ['PaymentController', 'CamundaConfiguration', 'ValidatePaymentWorker', 'FraudCheckWorker', 'ProcessPaymentWorker', 'NotifyPaymentWorker'],
    why: 'This is the interview backbone: Validate -> Fraud -> Gateway -> Account -> Process -> Bank -> Notify, with domain state stored in the payment DB.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as PaymentController :8094
  participant DB as Payment DB
  participant Z as Zeebe :26500
  participant V as ValidatePaymentWorker
  participant F as FraudCheckWorker
  participant P as ProcessPaymentWorker
  participant B as Bank API
  participant N as NotifyPaymentWorker
  Client->>API: POST /api/payments
  API->>DB: insert REQUESTED by idempotency key
  API->>Z: create payment-process variables
  Z-->>V: validate-payment
  V-->>Z: validated=true
  Z-->>F: fraud-check
  F-->>Z: fraudStatus=APPROVED
  Z-->>P: process-payment
  P->>DB: lock payment, check bankReference
  P->>B: charge(paymentId idempotency key)
  B-->>P: bankReference
  P->>DB: save PROCESSING + bankReference
  P-->>Z: complete bankReference
  Z-->>N: notify-payment
  N-->>Z: notificationSent=true`,
  },
  {
    id: 'worker-lifecycle',
    title: 'Worker lifecycle',
    endpoint: 'Zeebe job activation -> complete/fail/error',
    classes: ['FraudCheckWorker', 'PaymentService', 'ZeebeClient'],
    why: 'Workers pull jobs, execute bounded/idempotent code, and respond with completion, technical failure, or business error.',
    mermaid: `sequenceDiagram
  autonumber
  participant Z as Zeebe Broker
  participant W as FraudCheckWorker
  participant S as FraudService
  W->>Z: activate jobs type=fraud-check maxJobsActive=32
  Z-->>W: ActivatedJob variables + retries
  W->>S: fraud check timeout=2s
  alt approved
    W-->>Z: complete variables fraudStatus=APPROVED
  else fraud reject
    W-->>Z: throw BPMN error FraudRejected
  else service timeout
    W-->>Z: fail job retries-1 backoff=PT30S
  end`,
  },
  {
    id: 'retry-incident',
    title: 'Retry to incident',
    endpoint: 'bank-settlement technical failure',
    classes: ['BankSettlementWorker', 'BankService', 'Operate'],
    why: 'Bank timeout or 5xx should retry with backoff. When retries reach zero, an incident blocks the exact BPMN element.',
    mermaid: `sequenceDiagram
  autonumber
  participant Z as Zeebe
  participant W as BankSettlementWorker
  participant Bank
  participant O as Operate :8081
  Z-->>W: bank-settlement retries=3
  W->>Bank: settle payment
  Bank-->>W: 500
  W-->>Z: fail retries=2 backoff=30s
  Z-->>W: retry
  W->>Bank: settle payment
  Bank-->>W: timeout
  W-->>Z: fail retries=1
  Z-->>W: retry
  W->>Bank: settle payment
  Bank-->>W: 500
  W-->>Z: fail retries=0
  Z-->>O: incident at bankSettlement
  O-->>Z: operator resolves after fix`,
  },
  {
    id: 'message-correlation',
    title: 'Message correlation',
    endpoint: 'POST /api/payments/{paymentId}/bank-callback',
    classes: ['PaymentCallbackController', 'ZeebeClient', 'PaymentService'],
    why: 'External callbacks resume workflow with a message name and correlation key; the DB records the callback before publishing.',
    mermaid: `sequenceDiagram
  autonumber
  participant Bank
  participant API as PaymentCallbackController
  participant DB as Payment DB
  participant Z as Zeebe
  participant Proc as payment-process
  Proc-->>Z: wait for BankSettled message correlationKey=paymentId
  Bank->>API: callback paymentId status=SETTLED
  API->>DB: upsert callback idempotently
  API->>Z: publish BankSettled correlationKey=paymentId TTL=10m
  Z-->>Proc: correlate message
  Proc-->>Proc: continue to notify-payment
  API-->>Bank: 202 accepted`,
  },
  {
    id: 'saga-compensate',
    title: 'Saga compensate',
    endpoint: 'process-payment failure after holds/auth',
    classes: ['CompensationWorkers', 'PaymentService', 'GatewayService', 'AccountService'],
    why: 'Compensation is how a payment flow undoes committed local actions when later steps fail.',
    mermaid: `sequenceDiagram
  autonumber
  participant Z as payment-process
  participant A as AccountService
  participant G as GatewayService
  participant B as BankService
  Z->>A: reserve funds
  A-->>Z: holdId
  Z->>G: authorize gateway
  G-->>Z: authId
  Z->>B: settle
  B-->>Z: permanent reject
  Z->>G: void authorization authId
  G-->>Z: voided
  Z->>A: release hold holdId
  A-->>Z: released
  Z-->>Z: mark FAILED_COMPENSATED`,
  },
  {
    id: 'approval-timeout',
    title: 'Approval timeout',
    endpoint: 'amount > 100000 -> manual-review',
    classes: ['ApprovalController', 'ManualReviewWorker', 'PaymentService'],
    why: 'High-value payments need a human decision and an SLA branch so they do not wait forever.',
    mermaid: `sequenceDiagram
  autonumber
  participant Z as Zeebe
  participant T as Tasklist
  participant M as Manager
  participant API as ApprovalController
  Z-->>T: create manual-review task amount > 100000
  par manager acts
    M->>API: approve taskKey
    API->>Z: complete user task managerApproved=true
    Z-->>Z: continue process-payment
  and timeout clock
    Z-->>Z: boundary timer PT30M fires
    Z-->>Z: cancel task and route escalation
  end`,
  },
  {
    id: 'parallel-checks',
    title: 'Parallel fraud/credit/account',
    endpoint: 'BPMN parallel gateway checks',
    classes: ['FraudCheckWorker', 'CreditCheckWorker', 'AccountValidationWorker', 'ProcessPaymentWorker'],
    why: 'Fraud, credit, and account checks can run concurrently, then join before any money-moving step.',
    mermaid: `sequenceDiagram
  autonumber
  participant Z as Zeebe
  participant F as FraudCheckWorker
  participant C as CreditCheckWorker
  participant A as AccountValidationWorker
  participant P as ProcessPaymentWorker
  Z-->>F: fraud-check
  Z-->>C: credit-check
  Z-->>A: account-validation
  F-->>Z: fraudStatus=APPROVED
  C-->>Z: creditStatus=APPROVED
  A-->>Z: accountValid=true
  Z-->>Z: join parallel gateway
  alt all ok
    Z-->>P: process-payment
  else any reject
    Z-->>Z: reject and notify
  end`,
  },
];
