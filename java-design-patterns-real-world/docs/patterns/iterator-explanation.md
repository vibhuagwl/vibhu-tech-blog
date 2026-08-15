# Iterator — Interview Explanation Board

> **Demo:** `TransactionIteratorDemo` — `src/main/java/com/example/designpatterns/behavioral/iterator/TransactionIteratorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Iterator |
| **Category** | Behavioral |
| **One-line definition** | Provide a way to access elements of an aggregate sequentially without exposing its underlying representation. |
| **Problem class** | Clients dig into `TransactionRepository` internals to walk history — coupling statement export to ArrayList shape. |

## 2. Problem We Are Solving

Monthly statement export must walk **transaction history**:

```text
tx-1  amount=100
tx-2  amount=250
tx-3  amount=75
```

Output line format: `tx-1=100`, `tx-2=250`, `tx-3=75`.

`TransactionRepository` stores history internally. Today it may be an `ArrayList`; tomorrow paged DB cursors or lazy fetch.

The painful questions:

> How does statement export traverse history **without** `repo.items.get(i)` or `repo.getInternalList()`?

> How do you swap storage to **page-based DB** without breaking every `foreach` that assumed a list?

Relationships:

- **Aggregate** (`TransactionRepository`) — holds collection of `Transaction`
- **Element** (`Transaction` record) — `id`, `amount`
- **Iterator** — cursor over elements with `hasNext()` / `next()`
- **Client** — statement builder that only needs sequential access

## 3. What Happens Without the Pattern

Naive repository exposes internals:

```java
public class TransactionRepository {
    public final List<Transaction> items = new ArrayList<>();  // leaked
}

// Statement export — coupled to List
for (int i = 0; i < repo.items.size(); i++) {
    Transaction tx = repo.items.get(i);
    lines.add(tx.id() + "=" + tx.amount());
}

// Or worse — index loop on exposed list
for (Transaction tx : repo.items) { ... }  // still knows it's a List
```

Concrete pains:

1. **Storage coupling** — client assumes `ArrayList` indexing
2. **Cannot swap to pages** — DB cursor breaks index-based loops
3. **Encapsulation broken** — `items` field visible and mutable from outside
4. **Concurrent modification** — client mutates list while iterating
5. **Lazy fetch impossible** — client expects all rows in memory
6. **Every storage change** — rewrites all export, audit, and reporting callers

SOLID hits: **Encapsulation** violated; **DIP** — client depends on `List` not abstraction.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — clients reach into repository internals to traverse
2. **Naive pain** — `repo.items[i]`, exposed `List`, storage-specific loops
3. **Pattern introduces** — `TransactionRepository implements Iterable<Transaction>`
4. **Iterator contract** — `iterator()` returns `Iterator<Transaction>`
5. **Enhanced-for** — `for (Transaction tx : repo)` uses iterator under the hood
6. **Storage hidden** — backing `List.copyOf(items)` not exposed to client
7. **Client builds lines** — `tx.id() + "=" + tx.amount()` without knowing list vs pages

Traversal API stays stable when storage changes.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Aggregate** | `TransactionRepository` | `implements Iterable<Transaction>` |
| **Element** | `Transaction` record | `id`, `amount` — item traversed |
| **Iterator** | `items.iterator()` | Standard Java `Iterator<Transaction>` |
| **Client** | `TransactionIteratorDemo.run()` | Enhanced-for builds `lines` list |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `public record Transaction(String id, int amount)` | Element type traversed |
| `implements Iterable<Transaction>` | Aggregate contract for uniform traversal |
| `private final List<Transaction> items` | Backing storage **not** public |
| `this.items = List.copyOf(items)` | Defensive immutable copy in constructor |
| `public Iterator<Transaction> iterator()` | Factory method for traversal cursor |
| `return items.iterator()` | Delegates to list iterator — can swap to custom |
| `for (Transaction tx : repo)` | Client uses iterator without naming it |

## 7. Object/Class Diagram

```text
┌─────────────────────────────────────┐
│ TransactionRepository (Aggregate)   │
│   implements Iterable<Transaction>  │
│   - items: List<Transaction>        │
│   + iterator(): Iterator<Transaction>│
└──────────────────┬──────────────────┘
                   │
                   │ iterator()
                   ▼
┌─────────────────────────────────────┐
│ <<interface>> Iterator<Transaction> │
│   + hasNext(): boolean              │
│   + next(): Transaction             │
└──────────────────┬──────────────────┘
                   │
                   │ next() returns
                   ▼
┌─────────────────────────────────────┐
│ Transaction (Element)               │
│   id: String                        │
│   amount: int                       │
└─────────────────────────────────────┘

Client enhanced-for:
  for (Transaction tx : repo)
      └── uses Iterator internally (hidden)
```

## 8. Runtime Execution Flow

From `TransactionIteratorDemo.run()`:

```text
STEP 1: Build repository
  repo = new TransactionRepository([
    Transaction("tx-1", 100),
    Transaction("tx-2", 250),
    Transaction("tx-3", 75)
  ])

STEP 2: Client obtains traversal (implicit)
  for (Transaction tx : repo) {
    lines.add(tx.id() + "=" + tx.amount());
  }

Internal iterator steps:
  hasNext() true → next() → tx-1 → "tx-1=100"
  hasNext() true → next() → tx-2 → "tx-2=250"
  hasNext() true → next() → tx-3 → "tx-3=75"
  hasNext() false → loop ends

STEP 3: Output
  Visited: [tx-1=100, tx-2=250, tx-3=75]

Client never accessed repo.items or List index.
```

## 9. What the Client Doesn't Need to Know

- Whether backing store is `ArrayList`, `LinkedList`, or DB page cursor
- Iterator cursor position or internal index
- That `List.copyOf` defensively copies in constructor
- Size of collection before traversal (unless explicitly needed)
- Fail-fast vs weakly consistent iterator behavior

Client mental model: **for-each over repository**.

## 10. Before vs After

### Without Iterator

```text
Client (statement export)
   │
   ├── repo.items.get(i)     index loop
   │
   └── repo.getInternalList()  exposed List

Repository storage shape visible to every caller
```

### With Iterator

```text
Client
   │
   │ for (Transaction tx : repo)
   ↓
TransactionRepository.iterator()
   │
   └── Iterator<Transaction>  (hidden)

Repository storage hidden; traversal API stable
```

**Repository owns storage; client only sees sequential access.**

## 11. SOLID / Design Principles

| Principle | How Iterator applies |
|-----------|----------------------|
| **Encapsulation** | Internal list not exposed; iterator is the door |
| **Dependency Inversion** | Client depends on `Iterable`, not `List` |
| **Open/Closed** | Swap custom page iterator without editing clients |
| **Single Responsibility** | Repository stores; iterator traverses |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Page-based DB | Custom `Iterator` fetches next page on `hasNext()` | Lazy — document consistency |
| Filtered view | `FilteringIterator` wraps base iterator | Extra wrapper class |
| `Stream<Transaction>` | `stream()` on repository | Internal vs external iteration |
| Tree structure | Custom iterator over composite nodes | Iterator per aggregate type |
| Remove during iterate | Implement `remove()` or throw `UnsupportedOperationException` | Document contract |

## 13. Advantages

- Uniform traversal API across different storage shapes
- Clients cannot mutate internal collection through leaked reference
- Java enhanced-for works automatically with `Iterable`
- Custom lazy iterators enable million-row histories without load-all
- Swap implementation without breaking statement export

## 14. Disadvantages

- Simple in-memory `List` may not need abstraction — direct loop in same class is fine
- Custom iterators must document fail-fast vs snapshot behavior
- Over-abstraction for one-off internal loops inside repository
- Iterator not inherently thread-safe — one iterator per thread
- No random access — index-based needs different API

## 15. When to Use

1. Transaction history export walking repository without storage leak
2. Tree traversal with custom iterator over composite structure
3. Hide paging/cursor from API consumers (lazy DB fetch)
4. Uniform API when multiple collection implementations exist
5. Legacy collection wrappers exposing standard traversal

## 16. When NOT to Use

1. Internal loop over materialized `List` inside same class only
2. Client needs random access by index — expose carefully or use `List`
3. Single-pass `Stream` pipeline already fits — don't duplicate
4. Collection is always tiny and private — iterator adds noise

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Concurrent modification** | Immutable `List.copyOf` | Fail-fast iterator on mutable backing list |
| **Large datasets** | All rows in constructor | Lazy page iterator — don't load 10M rows |
| **`remove()`** | Not used | Throw `UnsupportedOperationException` if unsupported |
| **Thread safety** | Single-threaded demo | New iterator per thread; or synchronized |
| **Null elements** | `List.of` — no nulls | Document whether null transactions allowed |
| **Empty repository** | Loop no-ops | `Visited: []` — valid |
| **Consistency** | Snapshot copy | Weakly consistent iterator for live DB stream |

## 18. Possible Code Improvements

### Required (correctness)

- Page-based custom iterator for large histories (fetch on `next()`)
- Document read-only iterator — `remove()` throws
- Reject null transaction list in constructor

### Optional (clarity / prod)

- `Stream<Transaction> stream()` for filter/map pipelines
- `spliterator()` for parallel streams if safe
- Iterator that logs slow pages for observability

## 19. Mental Model

**Formula:**

```text
Problem:  Client knows storage shape (List index, exposed field)
Solution: Aggregate exposes iterator() → sequential access without internals
Benefit:  Swap list → pages → cursor without breaking callers
```

Memory trick: **"TV remote channel scan — same Next button whether channels live in cable box or streaming API."**

## 20. 30–60 Second Interview Answer

> **Iterator** lets clients traverse a collection sequentially without exposing its underlying representation. Statement export reaching into `TransactionRepository`'s internal `ArrayList` couples every caller to list shape — switching to paged DB cursors breaks them. `TransactionRepository` implements `Iterable<Transaction>` and `iterator()` hides the backing list. The client uses enhanced-for: `for (Transaction tx : repo)` and builds `tx-1=100, tx-2=250, tx-3=75` without touching internal storage. Custom iterators enable lazy paging for large histories. In Java, prefer standard `Iterator`/`Iterable` over inventing custom cursors. Document fail-fast behavior and whether `remove()` is supported.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Iterator vs Enumeration? | Iterator has optional `remove()`; Enumeration is legacy |
| Fail-fast? | `ConcurrentModificationException` if structure changes during iteration |
| Java Stream vs Iterator? | Stream = internal iteration; Iterator = external cursor |
| Lazy iterator? | `hasNext()` fetches next DB page when cursor exhausted |
| Exposing `getItems()`? | Breaks encapsulation — clients couple to List |

**Common mistake:** Public `getItems()` or `items` field — defeats the pattern.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.iterator.TransactionIteratorDemo
```
