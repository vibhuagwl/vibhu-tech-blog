export type CodeSequence = {
  id: string;
  title: string;
  endpoint: string;
  classes: string[];
  why: string;
  mermaid: string;
};

/** Click-through memory aid — match spring-resilience4j-lab (port 8087). */
export const CODE_SEQUENCES: CodeSequence[] = [
  {
    id: 'order-happy',
    title: 'Happy path order',
    endpoint: 'POST /api/orders → OrderService → PaymentGatewayClient → PaymentBankStub',
    classes: [
      'OrderController',
      'OrderService',
      'FraudCheckClient',
      'IdempotencyStore',
      'PaymentGatewayClient',
      'PaymentBankStub',
    ],
    why: 'Remember this path first. Everything else is a failure branch off the same call stack.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as OrderController
  participant Ord as OrderService
  participant Fraud as FraudCheckClient
  participant Idem as IdempotencyStore
  participant Pay as PaymentGatewayClient
  participant Bank as PaymentBankStub

  Client->>API: POST /api/orders JSON
  Note over Client,API: idempotencyKey + customerId + amountCents
  API->>Ord: placeOrder(request)
  Ord->>Fraud: screen(customerId)
  Fraud-->>Ord: ok
  Ord->>Idem: once(idempotencyKey)
  Idem->>Pay: charge(request)
  Note over Pay: AOP: Retry then CB then RL then Bulkhead
  Pay->>Bank: charge
  Bank-->>Pay: CAPTURED
  Pay-->>Idem: PaymentResult
  Idem-->>API: same result
  API-->>Client: CAPTURED`,
  },
  {
    id: 'aop-stack',
    title: 'AOP stack (remember order)',
    endpoint: 'PaymentGatewayClient.charge annotations → Spring AOP nesting',
    classes: ['PaymentGatewayClient', 'Retry', 'CircuitBreaker', 'RateLimiter', 'Bulkhead'],
    why: 'Do not memorize annotation line order. Spring default nesting is Retry outermost → Bulkhead innermost → bank method.',
    mermaid: `sequenceDiagram
  autonumber
  participant Caller as OrderService
  participant R as Retry aspect
  participant CB as CircuitBreaker
  participant RL as RateLimiter
  participant BH as Bulkhead
  participant M as charge method
  participant Bank as PaymentBankStub

  Caller->>R: charge(request)
  R->>CB: attempt
  CB->>RL: allow?
  RL->>BH: acquire permit
  BH->>M: enter
  M->>Bank: HTTP/stub
  Bank-->>M: result or throw
  M-->>BH: return
  BH-->>RL: release
  RL-->>CB: success or failure recorded
  alt transient fail and retries left
    CB-->>R: throw
    R->>CB: retry after backoff
  else success or retries exhausted
    R-->>Caller: result or exception
  end`,
  },
  {
    id: 'retry-flaky',
    title: 'Retry on flaky bank',
    endpoint: 'POST /api/payment/simulate?mode=FLAKY then POST /api/orders',
    classes: ['SimulateController', 'PaymentBankStub', 'PaymentGatewayClient', '@Retry(payment)'],
    why: 'Retry is only for transient errors. Business rejects must not burn retry budget.',
    mermaid: `sequenceDiagram
  autonumber
  participant Ops as You
  participant Sim as SimulateController
  participant Bank as PaymentBankStub
  participant Pay as PaymentGatewayClient
  participant R as Retry

  Ops->>Sim: GET /api/payment/simulate?mode=FLAKY
  Sim->>Bank: mode=FLAKY
  Ops->>Pay: charge via /api/orders
  Pay->>R: attempt 1
  R->>Bank: charge
  Bank-->>R: 503 / BankUnavailableException
  R->>R: wait backoff + jitter
  R->>Bank: attempt 2
  Bank-->>R: CAPTURED
  R-->>Pay: CAPTURED
  Note over R,Bank: BusinessException is ignored by Retry config`,
  },
  {
    id: 'circuit-open',
    title: 'Circuit opens → PENDING',
    endpoint: 'simulate DOWN → repeated orders → fallback pendingFallback',
    classes: [
      'PaymentGatewayClient.pendingFallback',
      'CircuitBreaker payment',
      'PaymentResult.pending',
    ],
    why: 'Open circuit stops calling the bank. Fallback returns PENDING — never fake CAPTURED.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant Pay as PaymentGatewayClient
  participant CB as CircuitBreaker
  participant Bank as PaymentBankStub
  participant FB as pendingFallback

  Note over Bank: mode=DOWN
  loop until failure rate trips CB
    Client->>Pay: charge
    Pay->>CB: call
    CB->>Bank: charge
    Bank-->>CB: BankUnavailableException
  end
  CB->>CB: state OPEN
  Client->>Pay: charge
  Pay->>CB: short-circuit
  CB->>FB: pendingFallback(request, cause)
  FB-->>Client: PENDING reason=BankUnavailableException
  Note over FB: BusinessException is rethrown — not degraded`,
  },
  {
    id: 'bulkhead-rl',
    title: 'Bulkhead + RateLimiter',
    endpoint: 'Concurrent /api/orders under load',
    classes: ['@Bulkhead(payment)', '@RateLimiter(paymentApi)', 'PaymentGatewayClient'],
    why: 'Bulkhead caps concurrent bank calls. RateLimiter caps call rate. Together they protect threads and downstream.',
    mermaid: `sequenceDiagram
  autonumber
  participant C1 as Client A
  participant C2 as Client B
  participant C3 as Client C
  participant RL as RateLimiter
  participant BH as Bulkhead maxConcurrent
  participant Bank

  C1->>RL: enter
  C2->>RL: enter
  C3->>RL: enter
  alt rate exceeded
    RL-->>C3: RequestNotPermitted
  else allowed
    C1->>BH: acquire
    C2->>BH: acquire
    alt no bulkhead permit
      BH-->>C2: BulkheadFullException
    else
      BH->>Bank: charge
      Bank-->>BH: result
    end
  end`,
  },
  {
    id: 'timelimiter-async',
    title: 'TimeLimiter async',
    endpoint: 'POST /api/orders/async + simulate SLOW',
    classes: ['OrderController.createAsync', 'PaymentGatewayClient.chargeAsync', '@TimeLimiter'],
    why: 'TimeLimiter wraps CompletableFuture. Sync charge() does not use TimeLimiter — remember that interview trap.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as OrderController
  participant Pay as chargeAsync
  participant TL as TimeLimiter
  participant CB as CircuitBreaker
  participant Bank

  Client->>API: POST /api/orders/async
  API->>Pay: chargeAsync(request)
  Pay->>TL: supplyAsync bank.charge
  TL->>CB: decorate future
  CB->>Bank: slow call
  alt finishes before timeout
    Bank-->>Client: CAPTURED
  else timeout
    TL-->>Pay: TimeoutException
    Pay->>Pay: pendingAsyncFallback
    Pay-->>Client: PENDING
  end`,
  },
  {
    id: 'idempotency',
    title: 'Idempotency replay',
    endpoint: 'Same idempotencyKey twice on POST /api/orders',
    classes: ['OrderService', 'IdempotencyStore', 'DuplicatePaymentException'],
    why: 'Retries + client double-submit need a store. Second call returns the first result — does not charge again.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant Ord as OrderService
  participant Idem as IdempotencyStore
  participant Pay as PaymentGatewayClient
  participant Bank

  Client->>Ord: placeOrder key=PAYMENT-1
  Ord->>Idem: once(PAYMENT-1)
  Idem->>Pay: charge
  Pay->>Bank: charge
  Bank-->>Idem: CAPTURED
  Idem-->>Client: CAPTURED

  Client->>Ord: placeOrder key=PAYMENT-1 again
  Ord->>Idem: once(PAYMENT-1)
  Idem-->>Client: cached CAPTURED
  Note over Idem,Bank: bank not called again`,
  },
  {
    id: 'cache-fx',
    title: 'Cache FX rate',
    endpoint: 'GET /api/fx → FxRateService @Cacheable',
    classes: ['OrderController', 'FxRateService', 'CacheConfig', 'Caffeine'],
    why: 'Cache is the “don’t ask twice” module. First hit calls bank FX; later hits skip until TTL.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as OrderController
  participant FX as FxRateService
  participant Cache as Caffeine cache
  participant Bank as bank FX stub

  Client->>API: GET /api/fx
  API->>FX: usdInr()
  FX->>Cache: lookup
  Cache-->>FX: miss
  FX->>Bank: fetch rate
  Bank-->>FX: 83.10
  FX->>Cache: store
  FX-->>Client: rate + bankHits=1

  Client->>API: GET /api/fx
  API->>FX: usdInr()
  FX->>Cache: lookup
  Cache-->>FX: hit
  FX-->>Client: rate + bankHits still 1`,
  },
  {
    id: 'full-degraded',
    title: 'Full degraded payment story',
    endpoint: 'Client → API → Fraud → Idempotency → R4j stack → Bank down → PENDING',
    classes: [
      'OrderController',
      'OrderService',
      'PaymentGatewayClient',
      'pendingFallback',
      'Actuator circuitbreakers',
    ],
    why: 'This is the 60-second interview picture: protect threads, retry only transient faults, degrade to PENDING, observe with Actuator.',
    mermaid: `sequenceDiagram
  autonumber
  participant Client
  participant API as OrderController :8087
  participant Ord as OrderService
  participant Pay as PaymentGatewayClient
  participant Bank
  participant Act as Actuator

  Client->>API: POST /api/orders
  API->>Ord: placeOrder
  Ord->>Pay: charge
  Pay->>Bank: DOWN
  Bank-->>Pay: errors
  Pay->>Pay: CB OPEN + pendingFallback
  Pay-->>Client: PENDING
  Note over Client: UI shows processing — not success
  Act->>Act: /actuator/circuitbreakers state OPEN`,
  },
];
