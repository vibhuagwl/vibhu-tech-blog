# Iterator — Interview Explanation Board

> **Demo:** `TransactionIteratorDemo` — `src/main/java/com/example/designpatterns/behavioral/iterator/TransactionIteratorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Iterator |
| **Category** | Behavioral |
| **One-line definition** | Provide a way to access elements of an aggregate sequentially without exposing its underlying representation. |
| **Problem class** | Clients dig into collection internals to traverse transaction history. |

## 2. Problem We Are Solving

Statement export walks `TransactionRepository` history. Naive code uses `repo.items.get(i)` or exposes internal `ArrayList`. Switching to paged DB cursors breaks every `foreach` that assumed a list.

## 3. What Happens Without the Pattern

```java
for (int i = 0; i < repo.items.size(); i++) { ... }
// or repo.getInternalList() — leaks storage
```

Pains: coupling to ArrayList, cannot swap to lazy pages, concurrent modification surprises.

## 4. How the Pattern Solves It

1. **Aggregate** — `TransactionRepository implements Iterable<Transaction>`
2. **Iterator** — `iterator()` returns `Iterator<Transaction>`
3. **Client** — enhanced-for `for (Transaction tx : repo)` uses iterator under the hood
4. Storage can change; traversal API stable

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Aggregate** | `TransactionRepository` | `Iterable<Transaction>` |
| **Element** | `Transaction` record | Item traversed |
| **Iterator** | `items.iterator()` | Standard Java iterator |
| **Client** | `TransactionIteratorDemo.run()` | Enhanced-for loop |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `implements Iterable<Transaction>` | Aggregate contract |
| `List.copyOf(items)` in constructor | Defensive copy, immutable backing |
| `iterator() → items.iterator()` | Hide list type |
| `for (Transaction tx : repo)` | Client uses uniform traversal |

## 7. Object/Class Diagram

```text
TransactionRepository (Iterable)
    │
    + iterator() ──► Iterator<Transaction>
                           │
                           + next() / hasNext()

Client enhanced-for ──► Iterator (hidden)
```

## 8. Runtime Execution Flow

```text
repo = new TransactionRepository([
  Transaction("tx-1", 100),
  Transaction("tx-2", 250),
  Transaction("tx-3", 75)
])

for (Transaction tx : repo)
  lines.add(tx.id() + "=" + tx.amount())

→ ["tx-1=100", "tx-2=250", "tx-3=75"]
```

Client never touches `List` directly.

## 9. What the Client Doesn't Need to Know

- Whether data is ArrayList, LinkedList, or page cursor
- Iterator cursor position
- Repository internal copy semantics

## 10. Before vs After

**Before:** Client → `repo.items[i]` or exposed list.

**After:** Client → `for (tx : repo)` via iterator.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **Encapsulation** | Storage hidden behind iterator |
| **DIP** | Client depends on `Iterable`, not `List` |

## 12. Extensibility

- Custom iterator over DB pages (lazy `next()` fetches page)
- `Stream<Transaction>` as alternate traversal
- Filter iterator wrapping base iterator

## 13. Advantages

- Uniform traversal API
- Swap storage without breaking clients
- Works with Java enhanced-for

## 14. Disadvantages

- Simple list may not need custom iterator
- Custom iterators must document fail-fast behavior
- Over-abstraction for one-off internal loops

## 15. When to Use

1. Transaction history export
2. Tree traversal (custom iterator over composite)
3. Hide paging/cursor from API consumers

## 16. When NOT to Use

1. Internal loop over materialized `List` in same class
2. Client needs index access — expose list or stream with care

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Concurrent modification | Fail-fast iterator vs snapshot |
| Large datasets | Lazy iterator, not load-all in constructor |
| `remove()` | Throw UnsupportedOperationException if unsupported |
| Thread safety | Iterator per thread |

## 18. Possible Code Improvements

**Required:** Page-based iterator for million-row history.

**Optional:** `Stream` support; read-only iterator contract.

## 19. Mental Model

**"TV remote channel scan."** Same next button whether channels live in cable box or streaming API.

## 20. 30–60 Second Interview Answer

> Iterator lets clients traverse a collection without knowing its internal structure. Statement export reaching into `TransactionRepository`'s ArrayList couples to list shape — switching to DB pages breaks callers. `TransactionRepository` implements `Iterable<Transaction>` and `iterator()` hides the backing list. Client uses enhanced-for to build `tx-1=100, tx-2=250, tx-3=75` without accessing internal storage. Custom iterators enable lazy paging for large histories.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Iterator vs Enumeration? | Iterator has remove (optional); Enumeration legacy |
| Fail-fast? | ConcurrentModificationException on structural change during iteration |
| Java Stream? | Stream is internal iteration; Iterator external |

**Common mistake:** Exposing `getItems()` list — breaks encapsulation.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.iterator.TransactionIteratorDemo
```
