export type Mistake = {bad: string; good: string; why: string};

export const PRODUCTION_MISTAKES: Mistake[] = [
  {bad: 'Trust Bloom true as exists', good: 'Verify in Redis/DB', why: 'False positives invent data or skip work wrongly'},
  {bad: 'Bloom alone for Kafka idempotency', good: 'Bloom hint + UNIQUE/SET NX', why: 'FP drops never-seen events'},
  {bad: 'Clear bits to delete', good: 'Counting BF or rebuild', why: 'Shared bits → false negatives'},
  {bad: 'Size for 1M, insert 100M', good: 'Alarm + resize/swap', why: 'FPP tends to 100%'},
  {bad: 'Per-pod filter, no sync', good: 'Pub/sub adds or RedisBloom', why: 'Cross-instance false 404s'},
  {bad: 'Unsynchronized BitSet writes', good: 'RW lock or immutable swap', why: 'Lost bit updates'},
  {bad: 'identityHashCode encoding', good: 'Stable UTF-8 / bytes', why: 'Breaks after restart'},
  {bad: 'Fail closed to 404 if BF down', good: 'Fail open to DB + alert', why: 'Outage for real users'},
  {bad: 'No metrics on blocked/DB', good: 'Track value of the filter', why: 'Cannot tune p or capacity'},
  {bad: 'Replace B-Tree with Bloom', good: 'Compose Bloom + index', why: 'Different jobs'},
];
