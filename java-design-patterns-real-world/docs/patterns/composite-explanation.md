# Composite — Interview Explanation Board

> **Demo:** `OrderCompositeDemo` — `src/main/java/com/example/designpatterns/structural/composite/OrderCompositeDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Composite |
| **Category** | Structural |
| **One-line definition** | Treat individual objects and groups of objects uniformly through a shared component interface; composites delegate to children recursively. |
| **Problem class** | Hierarchical trees where leaves and containers need the same operations (total, validate, export) without the client walking the tree. |

## 2. Problem We Are Solving

An e-commerce order is not a flat list. It can contain:

- Individual products (Laptop, Mouse)
- Bundles (Gaming Bundle)
- Bundles nested inside bundles

Example tree:

```text
Order
├── Laptop             ₹1000
├── Mouse              ₹50
└── Gaming Bundle
    ├── Keyboard       ₹200
    └── Headset        ₹300
```

The checkout service must **calculate the order total**. The painful question:

> How can the client compute `total()` without knowing whether it is dealing with a `Product` or a `Bundle` — and without nested loops when bundles contain bundles?

Relationships that make this hard:

- **Leaf** (`Product`) — has a price, no children
- **Composite** (`Bundle`) — holds a list of `OrderComponent`, may contain other bundles
- **Client** — should only care about "give me the total," not tree shape

## 3. What Happens Without the Pattern

Naive checkout code branches on concrete types:

```java
if (item instanceof Product) {
    total += product.price();
}
if (item instanceof Bundle) {
    for (Object child : bundle.children()) {
        if (child instanceof Product) { ... }
        if (child instanceof Bundle) { ... loop again ... }
    }
}
```

Concrete pains:

1. **Client knows concrete types** — violates abstraction; every new item type breaks callers
2. **`instanceof` everywhere** — fragile, unreadable, easy to miss a case
3. **Nested bundles** — recursion duplicated in every operation (total, discount, tax, export)
4. **Every new operation** (apply coupon, compute tax) rewrites tree-walking in the client
5. **Leaf and group not uniform** — cannot pass "any order line" to a generic pipeline

SOLID hits: **OCP** (new line type edits all clients), **SRP** (client owns traversal + business logic).

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — tree of products and nested bundles; client must distinguish types
2. **Naive pain** — `instanceof`, nested loops, duplicated recursion per operation
3. **Pattern introduces** — `OrderComponent` interface implemented by both `Product` (leaf) and `Bundle` (composite)
4. **Leaf** — `Product.total()` returns its own `price`
5. **Composite** — `Bundle.total()` asks each child `child.total()` and sums (recursion inside composite)
6. **Client simplifies** — `OrderComponent cart = order; cart.total();` — no type checks, no loops

The tree traversal moves **from the client into the composite**.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Component** | `OrderComponent` (interface) | Common contract (`total()`) for leaf and composite |
| **Leaf** | `Product` (record) | Terminal node; returns `price` from `total()` |
| **Composite** | `Bundle` | Holds `List<OrderComponent>`; aggregates via child delegation |
| **Client** | `OrderCompositeDemo.run()` | Builds tree, calls `cart.total()` on `OrderComponent` |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface OrderComponent { int total(); }` | Uniform operation — client never branches on type |
| `Product.total() → return price` | Leaf computes locally; no child delegation |
| `List<OrderComponent> children` in `Bundle` | Composite stores **same interface** as children — enables nesting |
| `Bundle.add(OrderComponent)` returns `this` | Fluent tree building without exposing raw list |
| `children.stream().mapToInt(OrderComponent::total).sum()` | Recursion: each child may be `Product` or nested `Bundle` |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────┐
                    │  <<interface>>      │
                    │  OrderComponent     │
                    │  + total(): int     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
    ┌─────────▼─────────┐           ┌─────────▼─────────┐
    │ Product (Leaf)    │           │ Bundle (Composite)│
    │ - sku             │           │ - children: List  │
    │ - price           │           │   <OrderComponent>│
    │ + total()         │           │ + add(child)      │
    └───────────────────┘           │ + total()         │
                                    └─────────┬─────────┘
                                              │
                                    contains 0..* OrderComponent
                                    (Product or Bundle)
```

## 8. Runtime Execution Flow

From `OrderCompositeDemo.run()`:

```text
Build:
  laptop = Product("LAPTOP", 1000)
  mouse  = Product("MOUSE", 50)
  keyboard = Product("KEYBOARD", 200)
  headset  = Product("HEADSET", 300)
  gamingBundle = Bundle.add(keyboard).add(headset)
  order = Bundle.add(laptop).add(mouse).add(gamingBundle)

Client:
  OrderComponent cart = order;
  cart.total();

Internal recursion:
  order.total()
    ├── laptop.total()        → 1000
    ├── mouse.total()         → 50
    └── gamingBundle.total()
          ├── keyboard.total() → 200
          └── headset.total()  → 300
  Result = 1550
```

The client never sees this recursion — only the final `1550`.

## 9. What the Client Doesn't Need to Know

- Whether a line item is leaf or composite
- How deep the nesting goes (bundle inside bundle inside bundle)
- How many children a bundle has
- That `total()` is implemented via stream + sum on composites
- SKU or price fields on individual products when only total matters

Client mental model: **one interface, one method call**.

## 10. Before vs After

### Without Composite

```text
Client
  │
  ├── Is it Product? → use price
  │
  └── Is it Bundle? → loop children
         ├── Product? → ...
         └── Bundle? → loop again ...
```

Client **understands and walks** the tree.

### With Composite

```text
Client
   │
   │ total()
   ↓
OrderComponent
   │
   ├── Product → return price
   │
   └── Bundle → ask each child.total()
                    ├── Product
                    └── Bundle → ...
```

**Composite understands the tree; client does not.**

## 11. SOLID / Design Principles

| Principle | How Composite applies |
|-----------|----------------------|
| **Open/Closed** | New line types (`SubscriptionBundle`) implement `OrderComponent` without editing client |
| **Single Responsibility** | `Bundle` owns traversal; client owns checkout orchestration |
| **Liskov** | Any `OrderComponent` can substitute another for `total()` |
| **Dependency Inversion** | Client depends on `OrderComponent`, not `Product`/`Bundle` |
| **Uniformity** | Core Composite idea — part-whole hierarchy with one interface |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| New leaf type (`GiftCard`) | Implement `OrderComponent` | Straightforward |
| New operation (`discount()`) | Add to interface — **all** types must implement | Interface grows (transparency vs safety debate) |
| New operation without touching leaves | **Visitor** over composite tree | Different pattern; better for many operations |
| Child mgmt on interface | Put `add()` on `OrderComponent` | Transparency (any node) vs safety (only `Bundle`) |

This demo keeps `add()` only on `Bundle` (safety).

## 13. Advantages

- Client code is simple: `item.total()` for any node
- Recursive structure is natural for menus, org charts, file systems, order lines
- Adding new composite or leaf types is localized
- Same pattern supports multiple operations once on the interface

## 14. Disadvantages

- Can over-engineer flat lists (a `List<Product>` + loop is clearer)
- Adding methods to `OrderComponent` forces updates on all implementors
- Harder to restrict "only bundles can have children" if `add()` is on the interface
- Cycle detection needed if `Bundle.add()` allows parent-as-child
- Type-specific behavior (SKU lookup) may leak if everything is forced through one interface

## 15. When to Use

1. Order/cart line items with bundles and nested bundles
2. UI component trees (panel contains buttons and sub-panels)
3. Org charts, file directories, permission trees
4. When clients must run the **same operation** on leaves and groups uniformly

## 16. When NOT to Use

1. Flat `List<Product>` with no nesting — simple iteration wins
2. Leaves and composites need **radically different** APIs
3. Performance-critical paths where virtual dispatch + recursion is too costly
4. When **Visitor** or external queries fit better than fat component interfaces

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Cycles** | Not guarded | `Bundle.add()` must reject adding self or ancestor |
| **Null children** | `ArrayList` only | Validate on `add()` |
| **Empty bundle** | `total()` returns 0 | Business rule: allow or reject empty bundles? |
| **Threads** | Not shared | Immutable trees or synchronized `Bundle` if concurrent |
| **Transparency** | `add()` only on `Bundle` | Client must know bundle type to build tree |
| **Deep trees** | Unbounded nesting | Stack overflow risk on very deep recursion — consider iterative walk |

## 18. Possible Code Improvements

### Required (correctness)

- Cycle detection in `Bundle.add(OrderComponent)`
- Reject null components in `add()`

### Optional (clarity / prod)

- `String name()` on `OrderComponent` for debugging / receipts
- Immutable `Bundle` built via factory instead of mutable `add()`
- Separate `OrderComponent` (read) from `MutableBundle` (build)
- `default int discount()` with override on promotions bundle

## 19. Mental Model

**Formula:**

```text
Problem:  Leaf + Group + nested groups → client logic explodes
Solution: Common interface + Composite holds same interface → recursive delegation
Benefit:  Client treats single object and group the same way
```

Memory trick: **"One interface, one call — the tree walks itself."**

## 20. 30–60 Second Interview Answer

> **Composite** is a structural pattern for part-whole hierarchies — like an order with products and nested bundles. The problem is the client would need `instanceof` and nested loops to total products vs bundles vs bundles-inside-bundles. Composite gives both leaves (`Product`) and composites (`Bundle`) a common `OrderComponent` interface. `Product.total()` returns its price; `Bundle.total()` sums each child's `total()` recursively. The client just calls `cart.total()` on `OrderComponent` without knowing tree shape. In our demo, laptop + mouse + gaming bundle (keyboard + headset) totals 1550 through hidden recursion inside `Bundle`.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Composite vs Decorator? | Composite models **tree structure** (parent-child); Decorator wraps **one** object to add behavior |
| Transparency vs safety? | Put `add()` on interface (transparent) vs only on `Bundle` (safe — this demo) |
| How add `tax()` without editing all classes? | Visitor over tree, or separate tax service with walk |
| Performance of deep trees? | Iterative traversal, memoized totals, or materialized subtotals |

**Common mistake:** Saying Composite is "just a list of objects" — the key is **uniform interface + recursive delegation** so the client does not traverse.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.composite.OrderCompositeDemo
```
