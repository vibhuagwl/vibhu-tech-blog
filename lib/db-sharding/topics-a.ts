import type {ShardTopic} from './types';

export const TOPICS_A: ShardTopic[] = [
  {
    id: 'vs',
    title: 'Partitioning vs Sharding',
    badge: 'Core',
    problem: '500M transactions: split inside one DB or across many DBs?',
    whenToUse: 'Partition for large-table lifecycle; shard when one DB cannot scale writes/storage.',
    whenAvoid: 'Sharding before proving partitions + indexes + caching are insufficient.',
    mermaid: `flowchart TB
  D[DATA DISTRIBUTION]
  D --> P[PARTITIONING]
  D --> S[SHARDING]
  P --> P1[Same DB]
  P --> P2[Part-1 Part-2 Part-3]
  S --> S1[Multiple DBs]
  S --> S2[DB-1 DB-2 DB-3]`,
    code: `| Feature | Partitioning | Sharding |
| Instances | Usually one | Multiple |
| Goal | Manage large tables | Horizontal DB scale |
| App complexity | Lower | Higher |
| Cross-unit TX | Normal DB TX | Hard (2PC/Saga) |
| Failure isolation | Limited | Better per shard |`,
    failure: 'Calling partitions "shards" in interviews confuses failure domains.',
    production: 'Often both: each shard has RANGE partitions by month.',
    interview30s: 'Partition = split table inside one system; shard = split across DB instances.',
    followUp: 'Can one shard contain partitions?',
    tradeoff: 'Ops simplicity vs horizontal scale.',
    memoryTrick: 'Partitions = drawers in one filing cabinet; shards = different offices.',
  },
  {
    id: 'range-part',
    title: 'Range Partitioning (PostgreSQL)',
    badge: 'SQL',
    problem: 'Query last quarter without scanning 500M rows.',
    whenToUse: 'Time/ID sequential access; drop old data cheaply.',
    whenAvoid: 'Hot newest partition under write storms without sub-hash.',
    mermaid: `flowchart TB
  T[transactions] --> Q1[2026-Q1]
  T --> Q2[2026-Q2]
  T --> Q3[2026-Q3]
  INS[INSERT May 10] --> Q2`,
    code: `CREATE TABLE transactions (
  transaction_id BIGINT,
  customer_id BIGINT,
  amount DECIMAL(18,2),
  transaction_date DATE,
  status VARCHAR(20)
) PARTITION BY RANGE (transaction_date);

CREATE TABLE transactions_2026_q1 PARTITION OF transactions
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE transactions_2026_q2 PARTITION OF transactions
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

INSERT INTO transactions VALUES (1001,50001,1000.00,'2026-05-10','SUCCESS');
-- lands in Q2`,
    failure: 'Missing DEFAULT/future partition → INSERT fails.',
    production: 'Automate CREATE PARTITION ahead of month; DROP old partitions for retention.',
    interview30s: 'RANGE by date routes rows; planner can prune unused quarters.',
    followUp: 'How attach/detach partitions online?',
    tradeoff: 'Great pruning vs management of many partitions.',
    memoryTrick: 'Range = calendar shelves.',
  },
  {
    id: 'list-part',
    title: 'List Partitioning',
    badge: 'SQL',
    problem: 'Isolate INDIA/UK/US regulatory data sets.',
    whenToUse: 'Low-cardinality categorical keys (region, brand).',
    whenAvoid: 'High cardinality lists that explode partition count.',
    mermaid: `flowchart LR
  T[transactions] --> IN[INDIA]
  T --> UK[UK]
  T --> US[US]`,
    code: `CREATE TABLE transactions (
  transaction_id BIGINT,
  customer_id BIGINT,
  region VARCHAR(20),
  amount DECIMAL(18,2)
) PARTITION BY LIST (region);

CREATE TABLE transactions_india PARTITION OF transactions FOR VALUES IN ('INDIA');
CREATE TABLE transactions_uk PARTITION OF transactions FOR VALUES IN ('UK');
CREATE TABLE transactions_us PARTITION OF transactions FOR VALUES IN ('US');

SELECT * FROM transactions WHERE region = 'INDIA'; -- prunes to india`,
    failure: 'Unknown region without DEFAULT partition.',
    production: 'Combine LIST(region) + RANGE(date) composite for banks.',
    interview30s: 'LIST maps discrete values to partitions — great for region.',
    followUp: 'DEFAULT partition role?',
    tradeoff: 'Clear isolation vs uneven sizes (US vs tiny region).',
    memoryTrick: 'List = labeled bins by country.',
  },
  {
    id: 'hash-part',
    title: 'Hash Partitioning',
    badge: 'SQL',
    problem: 'Evenly spread customers when range would hotspot newest IDs.',
    whenToUse: 'Even write distribution; equality lookups by key.',
    whenAvoid: 'Needing efficient date-range scans alone — pair with composite.',
    mermaid: `flowchart TD
  C[customer_id] --> H[HASH]
  H --> P0
  H --> P1
  H --> P2
  H --> P3`,
    code: `CREATE TABLE customer_transactions (
  transaction_id BIGINT,
  customer_id BIGINT,
  amount DECIMAL(18,2)
) PARTITION BY HASH (customer_id);

CREATE TABLE customer_transactions_p0 PARTITION OF customer_transactions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE customer_transactions_p1 PARTITION OF customer_transactions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE customer_transactions_p2 PARTITION OF customer_transactions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE customer_transactions_p3 PARTITION OF customer_transactions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);`,
    failure: 'Changing modulus requires rebuild/reshuffle.',
    production: 'Hash for evenness; range for time lifecycle — often composite.',
    interview30s: 'HASH(customer_id) % N spreads rows evenly across N partitions.',
    followUp: 'Hash partition vs hash shard?',
    tradeoff: 'Evenness vs harder range queries on hash key.',
    memoryTrick: 'Hash = shuffle cards into N piles.',
  },
  {
    id: 'composite',
    title: 'Composite + Time-Based Lifecycle',
    badge: 'SQL',
    problem: 'Need both date pruning AND even customer spread inside months.',
    whenToUse: 'Huge fact tables with time queries + hot inserts.',
    whenAvoid: 'Tiny tables — ops overhead wins nothing.',
    mermaid: `flowchart TB
  T[transactions] --> Y26[2026 RANGE]
  Y26 --> H0[HASH p0]
  Y26 --> H1[HASH p1]
  DROP[DROP 2024 partition] --> FAST[Instant vs DELETE]`,
    code: `-- Conceptual: RANGE(transaction_date) then HASH(customer_id) subpartitions
-- Lifecycle:
DROP TABLE transactions_2024;
-- vs
DELETE FROM transactions WHERE transaction_date < '2025-01-01'; -- rewrite hell

-- Prefer detach + archive + drop for retention`,
    failure: 'Too many tiny partitions → planning overhead.',
    production: 'Monthly partitions + archive to cold storage; DROP for GDPR/retention.',
    interview30s: 'Composite = range for time + hash for evenness; DROP beats mass DELETE.',
    followUp: 'How many partitions is too many?',
    tradeoff: 'Pruning power vs catalog bloat.',
    memoryTrick: 'Year folders, then hash envelopes inside.',
  },
  {
    id: 'pruning',
    title: 'Partition Pruning',
    badge: 'Interview',
    problem: 'Prove the planner skips unused partitions.',
    whenToUse: 'Always validate with EXPLAIN on production-like data.',
    whenAvoid: 'Functions on partition key that defeat pruning.',
    mermaid: `flowchart TD
  Q[WHERE date = 2026-05-10] --> PL[Planner]
  PL --> PR[Pruning]
  PR --> S1[Q1 SKIP]
  PR --> S2[Q2 SCAN]
  PR --> S3[Q3 SKIP]`,
    code: `EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE transaction_date = '2026-05-10';
-- Look for only one partition scanned

-- Anti-pattern (may defeat pruning):
WHERE date_trunc('day', transaction_date) = ...
-- Prefer sargable predicates on the partition column`,
    failure: 'OR across dates / casts → scan all partitions.',
    production: 'CI check EXPLAIN for critical banking reports.',
    interview30s: 'Pruning = planner eliminates partitions that cannot contain matching rows.',
    followUp: 'Runtime vs constraint exclusion?',
    tradeoff: 'Predicate design vs scan cost.',
    memoryTrick: 'Pruning = skip closed filing cabinets.',
  },
];
