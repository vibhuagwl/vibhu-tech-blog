export const PRODUCTION_MISTAKES = [
  {
    bad: 'Complete process-payment before saving the bank reference',
    good: 'Persist bankReference/idempotency result, then complete the Zeebe job',
    why: 'A crash after bank success but before persistence can create duplicate charges on retry.',
  },
  {
    bad: 'Store PAN, CVV, or full bank payload in workflow variables',
    good: 'Store sensitive data in secure domain systems and pass only IDs/masked routing facts',
    why: 'Variables can be exported, indexed, viewed, and logged operationally.',
  },
  {
    bad: 'Treat fraud rejection as a technical exception with retries',
    good: 'Model fraud rejection as an explicit business path or BPMN error boundary',
    why: 'Permanent business decisions should not burn retries or create noisy incidents.',
  },
  {
    bad: 'Remove old workers immediately after deploying a new BPMN version',
    good: 'Keep old job types until old instances drain or are migrated',
    why: 'Existing process versions may still activate old job types.',
  },
  {
    bad: 'Use Operate as the customer-facing payment status API',
    good: 'Expose status from the payment DB projection',
    why: 'Operate is an operational projection and may lag exporters or hide domain details.',
  },
  {
    bad: 'Use customerId as message correlation key for bank callbacks',
    good: 'Use paymentId or a unique bank reference mapped to one process instance',
    why: 'A customer can have multiple concurrent payments.',
  },
  {
    bad: 'Scale one worker deployment that handles every job type',
    good: 'Split critical workers and tune maxJobsActive/rate limits per downstream',
    why: 'A slow fraud dependency should not starve notification or approval work.',
  },
  {
    bad: 'Sleep inside a worker while waiting for a bank callback',
    good: 'Use a message catch event and durable timer',
    why: 'Workers should execute work, not hold threads for long waits.',
  },
  {
    bad: 'Resolve incidents manually without domain-state checks',
    good: 'Use a runbook that checks DB status, external reference, and idempotency before resolve/retry',
    why: 'Blind incident resolution can duplicate or skip money movement.',
  },
  {
    bad: 'Deploy Zeebe brokers without persistent volumes and backup drills',
    good: 'Run brokers as stateful workloads with PVCs, snapshots, PDBs, and restore testing',
    why: 'Zeebe broker state is durable workflow state.',
  },
];
