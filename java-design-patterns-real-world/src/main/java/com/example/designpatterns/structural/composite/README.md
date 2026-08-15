# Order Composite — problem first, then the pattern

Exactly — for interviews, **don't start with the pattern**. Start with **the problem**, then show how Composite solves it.

Full board: [`docs/composite-problem-solution.md`](../../../../docs/composite-problem-solution.md)

## 1. What problem are we solving?

An order can contain products, bundles, and nested bundles:

```text
Order
├── Laptop             ₹1000
├── Mouse              ₹50
└── Gaming Bundle
    ├── Keyboard       ₹200
    └── Headset        ₹300
```

> **How can the client calculate the total without knowing whether it is dealing with an individual product or a group/bundle?**

## 2. WITHOUT Composite

```java
if (item instanceof Product) { /* product total */ }
if (item instanceof Bundle) {
  // loop children — and if a child is a Bundle, nest again...
}
```

**Pain:** client knows concrete types, `instanceof` everywhere, nested bundles explode client logic, leaf and group aren't uniform.

## 3. How Composite solves it

Common interface → leaf + composite implement it → bundle recursively asks children:

```java
OrderComponent item = order; // Product OR Bundle
item.total();                // same call either way
```

**Composite understands the tree — not the client.**

## Interview formula

| | |
|--|--|
| **Problem** | Leaf + Group + nested groups → client logic becomes complex |
| **Solution** | Common interface + Composite holds `List<Component>` → recursive delegation |
| **Benefit** | Client treats single object and group the same way |

## Spoken answer

> When we have a hierarchical tree of individuals and groups, clients usually need different logic per type. Composite gives Leaf and Composite a **common interface** so the client treats both uniformly. The Composite **recursively delegates** to children and hides tree traversal.

## Run

```bash
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.composite.OrderCompositeDemo
```

Code: `OrderCompositeDemo.java` (`run()` prints PROBLEM → WITHOUT vs WITH → STEPs → recursion).
