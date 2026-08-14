export const MEMORY_SENTENCE =
  'false = definitely not present; true = maybe — verify in Redis/DB. Bloom is a tiny hint, never source of truth.';

export const SIXTY_SEC =
  'A Bloom filter is a bit array plus k hash probes. Insert sets k bits; lookup returns false if any bit is clear (definitely absent) or true if all set (maybe present). False positives exist; false negatives do not for successfully inserted keys. We size m and k from expected n and target FPP — about 10 bits/key at 1%. In Spring I put it in front of Redis/DB to stop cache penetration. Storage engines use the same idea per SSTable. It is never the ledger for idempotency.';

export const FIVE_MIN =
  'Start with Alice/Bob/Charlie vs David. Explain bit array and why multiple hashes reduce FPP. Derive m≈−n ln p/(ln2)² and k≈(m/n)ln2; give 1M keys ≈1.2MB at 1%. Implement with BitSet + double hashing h1+i*h2. Cover thread safety (RW lock or immutable swap). Spring flow: startup rebuild, add-on-create, lookup short-circuit. Cache penetration architecture. Cassandra SSTable Blooms. Kafka: Bloom hint + UNIQUE truth. Deletion hazard → counting BF. Distributed drift across pods. Fail open to DB if Bloom dies. Metrics: blocked lookups vs DB queries.';

export const TWO_MINUTE_STORY =
  'A Bloom filter answers set membership in tiny memory with a one-sided error: if it says no, the key was never inserted; if it says yes, you must still check an exact store. Internally it is a bit array of size m. On insert we set k bit positions from hash probes; on lookup we require all k bits to be set. Collisions between different keys create false positives, but we never clear bits for a normal filter, so we never create false negatives for keys we added. In a user API under bot traffic, I load user ids into a Bloom filter at startup. GET /users/{id} first asks the filter — garbage ids return 404 without touching Redis or the database. When the filter says maybe, I check Redis then the primary key index. On create I insert the row and add the id to the filter. For Kafka idempotency I may use Bloom as a negative cache, but the source of truth is a Redis SET NX or a UNIQUE(event_id) row — otherwise a false positive would drop a never-seen event. That is the production story: accelerate negatives, verify positives, measure blocked calls, rebuild when capacity or staleness demands it.';

export const COMPARISON: string[][] = [
  ['Structure', 'Memory', 'Exact?', 'FP', 'FN', 'Delete', 'Lookup', 'Best for'],
  ['HashSet', 'Full keys', 'Yes', 'No', 'No', 'Yes', 'O(1)', 'Exact local set'],
  ['Bloom', '≈10 bits/key@1%', 'No', 'Yes', 'No*', 'No*', 'O(k)', 'Negative checks'],
  ['Cuckoo', 'Higher than Bloom', 'No', 'Yes', 'No*', 'Yes', 'O(1)', 'Need deletes'],
  ['CMS', 'Tiny sketches', 'No', 'count err', 'N/A', 'N/A', 'O(k)', 'Frequencies'],
  ['Redis Set', 'Full keys+net', 'Yes', 'No', 'No', 'Yes', 'O(1)', 'Shared exact set'],
  ['DB index', 'Keys+pointers', 'Yes', 'No', 'No', 'Yes', 'O(log n)', 'Locate rows'],
];

export const MEMORY_TABLE: string[][] = [
  ['Keys \\ FPP', '10%', '1%', '0.1%'],
  ['1M', '~0.6 MB', '~1.2 MB', '~1.8 MB'],
  ['10M', '~6 MB', '~12 MB', '~18 MB'],
  ['100M', '~60 MB', '~120 MB', '~180 MB'],
  ['1B', '~0.6 GB', '~1.2 GB', '~1.8 GB'],
];

export const DB_ENGINE_TABLE: string[][] = [
  ['System', 'Bloom status', 'Notes'],
  ['PostgreSQL', 'Not default for heap/B-Tree', 'Extensions/research; not a PK replacement'],
  ['MySQL/InnoDB', 'Not classic Bloom for indexes', 'Adaptive hash ≠ Bloom'],
  ['Cassandra', 'Built-in per SSTable', 'Skips disk reads on misses'],
  ['RocksDB', 'Built-in filter policy', 'Configurable bits/key'],
  ['HBase', 'Built-in per HFile', 'Same LSM idea'],
  ['Redis', 'RedisBloom module / your app', 'Shared filter possible'],
  ['Elasticsearch', 'Internal filter caches', 'Not a user-level Bloom API'],
];

export const FAILURE_CASES: string[][] = [
  ['BF unavailable', 'errors/null bean', 'Fall back Redis/DB', 'reconnect', 'skip BF', 'alert'],
  ['BF corrupted', 'checksum/FPP spike', 'Rebuild from DB', 'yes', 'fail open', 'page'],
  ['False positive', 'DB miss after maybe', 'Return 404', 'n/a', 'extra lookup', 'metric fp'],
  ['Stale filter', 'new users 404', 'add-on-write + rebuild', 'scheduled', 'query DB', 'filter age'],
  ['App restart', 'empty RAM', 'ApplicationRunner rebuild', 'n/a', 'fail open until ready', 'startup time'],
  ['New DB rows', 'miss on other pods', 'pub/sub add / shared BF', 'rebuild', 'DB', 'drift alert'],
  ['Capacity exceeded', 'FPP→1', 'Resize+swap', 'rebuild', 'degraded', 'estimated_fpp'],
  ['Multi-instance drift', 'inconsistent 404', 'shared or broadcast', 'rebuild all', 'sticky≠fix', 'compare digests'],
];

export const CHECKLIST = [
  'Sized m/k from n and p (document assumptions)',
  'Stable value encoding (UTF-8 ids, not System.identityHashCode)',
  'Lookup treats true as maybe — always verify',
  'No false-negative path for inserted keys (add-on-write)',
  'Thread-safety strategy chosen (lock vs immutable swap)',
  'Startup rebuild + healing rebuild API',
  'Metrics: lookups, blocked, DB queries, estimated FPP, age',
  'Distributed consistency plan (pubsub / RedisBloom / rebuild SLA)',
  'Fail open to exact store if Bloom unhealthy',
  'Never use alone for idempotency / money / authz',
  'Capacity alarm before FPP collapses',
  'Counting BF or rebuild if deletes required',
];

export const CHEAT: [string, string][] = [
  ['Definition', 'Probabilistic membership bitset'],
  ['false', 'Definitely absent'],
  ['true', 'Maybe present (FP possible)'],
  ['FN', 'None for inserted keys (classic)'],
  ['Time', 'O(k) insert/lookup'],
  ['Space', '~10 bits/key @ 1% FPP'],
  ['m', '−n ln(p) / (ln2)²'],
  ['k', '(m/n) ln2'],
  ['vs HashSet', 'Tiny memory, not exact'],
  ['vs Redis Set', 'Local/shared bits vs exact keys'],
  ['vs DB index', 'Negative accelerator ≠ row locator'],
  ['vs Cuckoo', 'Cuckoo deletes easier, more RAM'],
  ['Spring', 'Bloom → Redis → DB'],
  ['LSM', 'Per-SSTable skip'],
  ['Kafka', 'Hint + UNIQUE truth'],
  ['Delete', 'Unsafe on classic BF'],
];

export const CLOSING =
  'Use Bloom filters to stop wasting work on keys that cannot exist — then verify every maybe against a real store.';

export const PROS_CONS: string[][] = [
  ['Pro', 'Extremely memory efficient at scale'],
  ['Pro', 'O(k) CPU, great negative cache'],
  ['Pro', 'Cuts DB/disk/network on absent keys'],
  ['Pro', 'Simple; proven in LSM engines'],
  ['Con', 'False positives require verification'],
  ['Con', 'Classic form cannot delete safely'],
  ['Con', 'Overfill destroys FPP'],
  ['Con', 'Cannot list keys or counts'],
  ['Con', 'Distributed drift without sync'],
  ['Con', 'Rebuild/swap operational cost'],
];
