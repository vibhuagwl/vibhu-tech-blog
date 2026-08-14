import type {BloomTopic} from './types';

export const TOPICS_A: BloomTopic[] = [
  {
    id: 'overview',
    title: '01. What is a Bloom Filter?',
    badge: 'Fundamentals',
    problem:
      'You need to ask “have I seen this key?” over millions/billions of keys without storing the keys themselves, accepting rare false positives.',
    whenToUse: 'Negative lookups, cache penetration shields, LSM SSTable skipping, URL denylists, “is this ID even possible?”.',
    whenAvoid: 'When you need exact membership, counting, retrieval of values, or safe deletes without a counting variant.',
    mermaid: `flowchart TD
  Q[Is key in set?] --> BF[Bloom Filter]
  BF -->|false| No[Definitely NOT present]
  BF -->|true| Maybe[Maybe present — verify]`,
    code: `// Alice, Bob, Charlie inserted
mightContain("Alice")  → true   // never a false negative
mightContain("David")  → false  // definitely absent
                       → true   // FALSE POSITIVE (rare)`,
    failure: 'Treating “true” as proof the key exists — then skipping the DB and returning invented data.',
    production: 'Bloom is a hint layer. Redis/DB/index remain source of truth. Lab: GET /api/users/{id}.',
    interview30s:
      'A Bloom filter is a probabilistic bit set for membership tests: false means definitely absent; true means maybe present. No false negatives for inserted keys; false positives are the trade for tiny memory.',
    followUp: 'Why can it never have false negatives?',
    tradeoff: 'Memory/speed vs certainty. You buy certainty with a follow-up exact store.',
    memoryTrick: 'false = NO; true = MAYBE; never invent truth from MAYBE.',
  },
  {
    id: 'architecture',
    title: '02. Internal Working',
    badge: 'Bits + hashes',
    problem: 'Need a mental model of insert/search with multiple hash probes into a bit array.',
    whenToUse: 'Any whiteboard explanation of Bloom filters.',
    whenAvoid: 'Hand-waving “it’s just a hashset of bits” without k and collisions.',
    mermaid: `flowchart TD
  Key[Alice] --> H1[Hash1 → 2]
  Key --> H2[Hash2 → 5]
  Key --> H3[Hash3 → 8]
  H1 --> Bits[0 1 1 0 0 1 0 0 1 0]
  H2 --> Bits
  H3 --> Bits`,
    code: `add(x):
  for i in 1..k:
    bits[ h_i(x) % m ] = 1

mightContain(x):
  for i in 1..k:
    if bits[ h_i(x) % m ] == 0: return false
  return true  // maybe`,
    failure: 'Using k=1 — high collision rate → many false positives.',
    production: 'Lab uses BitSet + DoubleHashStrategy (h1 + i*h2 mod m).',
    interview30s:
      'Allocate m bits. On insert, set k bit positions from k hash probes. On lookup, if any probed bit is 0 → absent; if all 1 → maybe. Collisions of different keys on the same bits create false positives.',
    followUp: 'Draw Alice then David on a 10-bit array.',
    tradeoff: 'Larger m or better k lowers FPP but costs memory/CPU.',
    memoryTrick: 'All bits set for key ⇒ maybe; any zero ⇒ impossible.',
  },
  {
    id: 'math',
    title: '03. Math, Optimal m/k, Memory',
    badge: 'Interview numbers',
    problem: 'Interviewers ask you to size a filter for n keys at false-positive rate p.',
    whenToUse: 'Capacity planning and system-design estimations.',
    whenAvoid: 'Memorizing formulas without the ≈10 bits/key rule of thumb.',
    mermaid: `flowchart LR
  n[n keys] --> m["m ≈ -n ln(p) / (ln2)^2"]
  m --> k["k ≈ (m/n) ln2"]
  n --> p[target FPP]
  p --> m`,
    code: `// 1M keys, p=0.01
// ≈ 9.6 bits/key → ~1.2 MB
BloomFilterConfig.of(1_000_000, 0.01);
// FPP ≈ (1 - e^{-kn/m})^k`,
    failure: 'Sizing for 1M then inserting 100M → FPP collapses toward 1.',
    production: 'Lab BloomFilterConfig.of computes m/k; stats expose estimated FPP.',
    interview30s:
      'Pick n and p. m grows with n and −ln(p). k ≈ 0.7·m/n (about 7 hashes for 1% FPP). Rule of thumb: ~10 bits per key at 1% FPP.',
    followUp: 'Memory for 100M keys at 0.1% FPP?',
    tradeoff: 'Halving p costs more bits than linearly — logarithmic in 1/p.',
    memoryTrick: '1% FPP ≈ 10 bits/key; 0.1% ≈ 14 bits/key.',
  },
  {
    id: 'java-impl',
    title: '04. Java From Scratch',
    badge: 'Lab core',
    problem: 'Implement add/mightContain without Guava, with configurable n and p.',
    whenToUse: 'Interview coding + production-shaped service beans.',
    whenAvoid: 'Pulling a library before you can explain BitSet + hashing.',
    mermaid: `flowchart TD
  Cfg[BloomFilterConfig] --> BF[BloomFilter]
  HS[HashStrategy] --> BF
  BF --> BitSet
  BF --> Metrics`,
    code: `BloomFilter<String> filter = new BloomFilter<>(1_000_000, 0.01);
filter.add("user-100");
filter.mightContain("user-100"); // true
filter.mightContain("user-999"); // usually false`,
    failure: 'Encoding objects via identity hashCode — unstable across JVMs/restarts.',
    production: 'spring-bloom-filter-lab/core/BloomFilter.java with RW locks + rebuildFrom.',
    interview30s:
      'Compute m/k from n,p; allocate BitSet(m); encode value to bytes; set/get k indexes from double hashing; never return “exists” without verifying elsewhere.',
    followUp: 'How do you unit-test FPP statistically?',
    tradeoff: 'BitSet simplicity vs AtomicBitSet / Roaring for huge distributed filters.',
    memoryTrick: 'Config derives m/k; BitSet stores truth of bits only.',
  },
  {
    id: 'hashing',
    title: '05. Double Hashing',
    badge: 'k without k hashes',
    problem: 'Running k independent digests is expensive and unnecessary for Bloom filters.',
    whenToUse: 'Always in practical implementations.',
    whenAvoid: 'Assuming you need SHA-256 × k.',
    mermaid: `flowchart TD
  Bytes --> H1[h1]
  Bytes --> H2[h2 odd]
  H1 --> I["index(i)=h1+i*h2 mod m"]
  H2 --> I`,
    code: `long h1 = mix64(fnv(bytes));
long h2 = mix64(murmur(bytes) | 1);
index(i) = floorMod(h1 + i * h2, m);`,
    failure: 'h2 even on power-of-two m → poor coverage of residues.',
    production: 'DoubleHashStrategy in the lab; force h2 odd.',
    interview30s:
      'Kirsch–Mitzenmacher: two hashes generate k indexes. Good enough when m/k sized correctly; crypto hashes are usually overkill.',
    followUp: 'When would you use cryptographic hashes?',
    tradeoff: 'Speed vs adversarial robustness (see security topic).',
    memoryTrick: 'h1 + i·h2, keep h2 odd.',
  },
  {
    id: 'concurrency',
    title: '06. Thread Safety',
    badge: 'BitSet races',
    problem: 'BitSet is not thread-safe; concurrent add can lose bit sets; torn reads can rare-FN under races.',
    whenToUse: 'Shared mutable filter across request threads.',
    whenAvoid: 'Synchronizing every lookup on a read-only snapshot rebuilt offline.',
    mermaid: `flowchart TD
  Add[add] --> W[writeLock]
  Lookup[mightContain] --> R[readLock]
  Rebuild --> W`,
    code: `// Lab: ReentrantReadWriteLock around BitSet
// Alternative: build immutable filter, AtomicReference.swap`,
    failure: 'Unsynchronized BitSet under writes → lost updates / theoretical FN under races.',
    production: 'Prefer immutable rebuild+swap for mostly-read filters; RW lock for incremental adds.',
    interview30s:
      'BitSet needs external sync. Read-mostly: build new filter and CAS swap. Incremental: write lock on add, read lock on lookup, or striped atomics.',
    followUp: 'Is synchronized necessary if only one writer thread?',
    tradeoff: 'Lock contention vs copy-on-rebuild memory spike.',
    memoryTrick: 'No sync on BitSet = undefined bits.',
  },
];
