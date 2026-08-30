import type {EndpointRow, FlowStep} from '@/lib/oauth-jwt-endpoints';

export type {EndpointRow, FlowStep};

export const SERVICES = [
  {name: 'API Gateway', port: '8080', role: 'Routing, correlation id, edge rate limit'},
  {name: 'Flash Sale Service', port: '8082', role: 'Sale state, idempotency, Redis gate, 202 enqueue'},
  {name: 'Inventory Service', port: '8083', role: 'PostgreSQL authority — atomic reserve / release / confirm'},
  {name: 'Order Service', port: '8084', role: 'Orders + saga orchestrator'},
  {name: 'Payment Service', port: '8085', role: 'Strategy + Resilience4j, outbox outcomes'},
  {name: 'Notification Service', port: '8086', role: 'Side effects only — no business state'},
] as const;

export const ARCHITECTURE = `Client
  │
  ▼
API Gateway :8080
  │  JWT / X-User-Id (local)  +  X-Correlation-Id
  ▼
Flash Sale :8082
  │  rate limit · sale state · idempotency
  │  Redis Lua DECR  inv:gate:{productId}
  │  outbox OrderRequested   (partition key = productId)
  ▼  202 PENDING
Kafka
  │
  ├─► Inventory :8083   atomic SQL  UPDATE … WHERE available >= qty
  │       outbox InventoryReserved | InventoryRejected
  ├─► Order :8084       create order + saga → PaymentRequested
  ├─► Payment :8085     charge outside TX → PaymentSucceeded | Failed
  └─► Notification :8086

Redis = shed losers     PostgreSQL = truth     Kafka + outbox + unique = exactly-once`;

export const API_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/api/v1/flash-sales/{saleId}',
    service: 'Flash Sale',
    port: '8082',
    purpose: 'Cached sale metadata (state machine window)',
    auth: 'JWT or X-User-Id (local)',
    flow: 'Catalog',
  },
  {
    method: 'GET',
    path: '/api/v1/flash-sales/{saleId}/products',
    service: 'Flash Sale',
    port: '8082',
    purpose: 'SKU list for the sale',
    auth: 'JWT or X-User-Id (local)',
    flow: 'Catalog',
  },
  {
    method: 'POST',
    path: '/api/v1/flash-sales/{saleId}/orders',
    service: 'Flash Sale',
    port: '8082',
    purpose: 'Enqueue purchase — 202 PENDING, never sync payment',
    auth: 'USER + Idempotency-Key',
    flow: 'Buy',
  },
  {
    method: 'GET',
    path: '/api/v1/orders/{orderId}',
    service: 'Order',
    port: '8084',
    purpose: 'Order status after saga steps',
    auth: 'USER',
    flow: 'Buy',
  },
  {
    method: 'POST',
    path: '/api/v1/orders/{orderId}/cancel',
    service: 'Order',
    port: '8084',
    purpose: 'Compensate — cancel + InventoryReleaseRequested',
    auth: 'USER',
    flow: 'Compensate',
  },
  {
    method: 'GET',
    path: '/api/v1/inventory/{productId}',
    service: 'Inventory',
    port: '8083',
    purpose: 'Authoritative available / reserved / sold',
    auth: 'Public (lab)',
    flow: 'Ops',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/dlq/replay',
    service: 'Flash Sale',
    port: '8082',
    purpose: 'Replay *.dlq payload with same eventId',
    auth: 'ADMIN / OPERATIONS',
    flow: 'Ops',
  },
];

export const BUY_STEPS: FlowStep[] = [
  {
    step: 1,
    actor: 'User',
    method: 'POST',
    endpoint: '/api/v1/flash-sales/SALE1001/orders',
    detail: 'Gateway stamps X-Correlation-Id. Flash sale checks rate limit, sale ACTIVE, unique idempotency.',
  },
  {
    step: 2,
    actor: 'Redis',
    method: 'EVAL',
    endpoint: 'inv:gate:P1001',
    detail: 'Lua GET+DECR. 0 → 409 sold out, no Kafka. Missing key → fail closed.',
  },
  {
    step: 3,
    actor: 'Flash Sale',
    method: 'INSERT',
    endpoint: 'outbox_events',
    detail: 'Same TX as idempotency row. HTTP 202 { requestId, orderId, status: PENDING }.',
  },
  {
    step: 4,
    actor: 'Inventory',
    method: 'UPDATE',
    endpoint: 'inventory WHERE available >= qty',
    detail: 'rows==1 owns the unit. Outbox InventoryReserved. Duplicate eventId is a no-op.',
  },
  {
    step: 5,
    actor: 'Order + Payment',
    method: 'SAGA',
    endpoint: 'PaymentRequested → Succeeded|Failed',
    detail: 'Provider call is outside the DB TX. Fail → release reservation + cancel order.',
  },
];
