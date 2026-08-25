/** Manual caches + LRU/LFU algorithms. */

export const MANUAL_CACHE = `Before Spring annotations, own the interface:

interface Cache<K,V> {
  V get(K key);
  void put(K key, V value);
  void remove(K key);
  void clear();
}

Implementations in spring-cache-lab:
  SimpleCache   — HashMap, unbounded (dangerous in prod)
  LRUCache      — LinkedHashMap accessOrder=true OR HashMap+DLL
  LFUCache      — freq map + LinkedHashSet per frequency
  TTLCache      — entry + expireAt; lazy expire on get

WHY manual first: interviewers ask eviction mechanics — annotations hide them.`;

export const LRU = `LRU = Least Recently Used

Capacity=3: put A B C → get(A) → order B C A → put(D) → evict B → C A D
B removed because it became the least recently used after A was touched.

LinkedHashMap(accessOrder=true) + removeEldestEntry → simple O(1) avg LRU.

Manual O(1) design:
  HashMap<K, Node>     → O(1) lookup
  Doubly Linked List   → O(1) move-to-head / remove-tail
  get/put target O(1)

MEMORY: LRU evicts what you have not touched lately.`;

export const LFU = `LFU = Least Frequently Used

A:10 hits, B:5, C:1 → under pressure C is evicted.

Structure:
  HashMap<Key, Node>
  HashMap<freq, LinkedHashSet<Key>>  (or DLL of freq buckets)
  minFreq pointer

Complexity: O(1) get/put with careful bucket maintenance.

When LFU: stable popularity skew (catalog bestsellers).
When LRU: recency matters more than lifetime count (sessions).

MEMORY: LFU evicts the unpopular; LRU evicts the forgotten.`;

export const ALGO_TABLE: string[][] = [
  ['Algorithm', 'Evicts', 'Best for', 'Provider note'],
  ['LRU', 'Least recently used', 'Recency-heavy reads', 'Caffeine approx Window TinyLFU (not pure LRU)'],
  ['LFU', 'Least frequently used', 'Stable hot keys', 'Implement carefully; Redis maxmemory policies differ'],
  ['FIFO', 'Oldest insert', 'Simple queues', 'Rarely ideal alone'],
  ['TTL', 'Time expired', 'Staleness bound', 'expireAfterWrite / Redis EX'],
  ['Random', 'Random victim', 'Cheap under pressure', 'Redis allkeys-random'],
];

export const LRU_CODE = `public final class LruCache<K,V> extends LinkedHashMap<K,V> {
  private final int capacity;
  public LruCache(int capacity) {
    super(capacity, 0.75f, true); // accessOrder
    this.capacity = capacity;
  }
  @Override protected boolean removeEldestEntry(Map.Entry<K,V> e) {
    return size() > capacity;
  }
}`;

export const LFU_CODE = `// Sketch — full lab in spring-cache-lab/.../cache/LfuCache.java
// get: bump freq, move key across freq buckets; put: evict minFreq if full`;
