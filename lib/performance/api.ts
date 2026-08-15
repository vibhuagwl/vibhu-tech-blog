/** API / HTTP performance — merged (no separate "HTTP tips" dump). */

export const HTTP_ROWS: string[][] = [
  ['HTTP/1.1', 'One request per connection (pipelining rare)', 'Keep-alive still helps; connection churn hurts TLS'],
  ['HTTP/2', 'Multiplexed streams on one TLS connection', 'Default for many ALB/CloudFront paths — verify end-to-end'],
  ['HTTP/3', 'QUIC/UDP — fewer handshake RTTs on lossy networks', 'Edge/CDN benefit first; origin may still be H1/H2'],
  ['Keep-alive / pool', 'Reuse TCP+TLS to downstreams', 'RestClient/WebClient/Hikari style pooling'],
  ['gzip / Brotli', 'Shrink payloads; CPU cost on compress', 'Prefer for text JSON; skip tiny payloads'],
  ['Cache-Control / ETag', 'Conditional GETs cut origin work', 'Correct invalidation > aggressive TTL'],
];

export const REST_API_ROWS: string[][] = [
  ['Pagination', 'Never unbounded list endpoints', 'Prefer cursor for deep pages; offset OK for admin UIs'],
  ['Field selection / DTO', 'Return only what clients need', 'Projections beat entity serialization'],
  ['Batch / bulk', 'Amortize RTT for multi-get', 'Cap batch size; fail partials explicitly'],
  ['Async accept', '202 + job id for long work', 'Protect sync path; process via queue'],
  ['Idempotency-Key', 'Safe client retries on write', 'Required for payments / POSTs at gateway'],
  ['Timeouts + CB', 'Fail fast; bound fan-out', 'See /resilience4j — never blind retry POST'],
  ['Rate limit', 'Protect capacity; fair use', 'Shed non-critical before payment path'],
];

export const API_BAD_GOOD = {
  bad: `// Unbounded — latency and memory grow with table size
@GetMapping("/orders")
List<Order> getAllOrders() {
  return orderRepository.findAll();
}`,
  good: `// Bounded page + filter — predictable p99 and DB load
@GetMapping("/orders")
Page<OrderResponse> getOrders(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "50") int size,
    @RequestParam(required = false) String status) {
  var pageable = PageRequest.of(page, Math.min(size, 100));
  return orderService.findOrders(status, pageable);
}`,
};
