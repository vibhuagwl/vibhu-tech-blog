# Composite — start with the problem (interview board)

Exactly — for interviews, don't start with the pattern. Start with **the problem**, then show how Composite solves it.

## 1. What problem are we solving?

Imagine an order can contain:

* Individual products
* Bundles
* A bundle can contain products
* A bundle can contain another bundle

For example:

```text
Order
├── Laptop             ₹1000
├── Mouse              ₹50
└── Gaming Bundle      ₹500
    ├── Keyboard       ₹200
    └── Headset        ₹300
```

The problem is:

> **How can the client calculate the total without knowing whether it is dealing with an individual product or a group/bundle?**

---

## 2. The problem WITHOUT Composite

You could write different logic:

```java
if (item instanceof Product) {
    // product calculation
}

if (item instanceof Bundle) {
    // bundle calculation
    // loop through children
}
```

And if bundles can contain bundles:

```text
if Product
   calculate product

if Bundle
   loop children

   if child is Product
      calculate

   if child is Bundle
      loop again

      ...
```

Now the client becomes responsible for understanding the entire tree.

### Problems

1. **Client knows concrete types**
2. **Lots of `instanceof` / type checking**
3. **Nested bundles make code complicated**
4. **Every new operation requires modifying client logic**
5. **Leaf and group aren't treated uniformly**

---

## 3. How Composite solves it

Create a common interface:

```java
public interface OrderComponent {
    int total();
}
```

Now both objects implement the same interface.

### Leaf

```java
public record Product(String sku, int price)
        implements OrderComponent {

    public int total() {
        return price;
    }
}
```

Product calculates **its own total**.

### Composite

```java
public class Bundle implements OrderComponent {

    private final List<OrderComponent> children = new ArrayList<>();

    public Bundle add(OrderComponent component) {
        children.add(component);
        return this;
    }

    public int total() {
        return children.stream()
                .mapToInt(OrderComponent::total)
                .sum();
    }
}
```

Bundle calculates its total by asking **each child for its total**.

Working code: `src/main/java/.../structural/composite/OrderCompositeDemo.java` (`run()` / `main`).

---

## 4. The important part: recursion

Suppose:

```java
Product laptop = new Product("LAPTOP", 1000);
Product mouse = new Product("MOUSE", 50);

Bundle accessories = new Bundle()
        .add(mouse);

Bundle order = new Bundle()
        .add(laptop)
        .add(accessories);
```

Tree:

```text
order (Bundle)
│
├── laptop (Product)       → 1000
│
└── accessories (Bundle)
     │
     └── mouse (Product)   → 50
```

Now client simply does:

```java
order.total();
```

Internally:

```text
order.total()
    │
    ├── laptop.total()
    │      └── 1000
    │
    └── accessories.total()
           │
           └── mouse.total()
                  └── 50

Result = 1050
```

The **recursive calculation is hidden inside the Composite**.

---

## 5. What did Composite actually solve?

The biggest problem it solved is:

> **The client no longer needs to know whether an object is a Leaf or a Composite.**

Client only knows:

```java
OrderComponent
```

So:

```java
OrderComponent item = ...
item.total();
```

works for both:

```text
Product.total()
```

and:

```text
Bundle.total()
```

Even this works:

```text
Bundle
   ↓
Bundle
   ↓
Bundle
   ↓
Product
```

without changing client code.

---

## 6. The before vs after

### Without Composite

```text
Client
  │
  ├── Is it Product?
  │      └── calculate
  │
  └── Is it Bundle?
         └── iterate
              ├── Product?
              └── Bundle?
                    └── iterate again
```

Client understands the tree.

### With Composite

```text
Client
   │
   │ total()
   ↓
OrderComponent
   │
   ├── Product
   │     └── return price
   │
   └── Bundle
         └── ask children for total
                  │
                  ├── Product
                  └── Bundle
                       └── ...
```

**Composite understands the tree, not the client.**

---

## Interview answer

If interviewer asks:

> **"What problem does Composite solve?"**

Say:

> **When we have a hierarchical tree structure containing both individual objects and groups of objects, the client often needs different logic to handle each type. Composite solves this by giving Leaf and Composite a common interface, allowing the client to treat both uniformly. The Composite recursively delegates operations to its children, hiding the tree traversal from the client.**

### Remember this formula

**Problem:** Leaf + Group + nested groups → client logic becomes complex.

**Solution:** Common interface + Composite contains same interface → recursive delegation.

**Benefit:** Client treats **single object and group of objects the same way**.

---

## Run this demo

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.composite.OrderCompositeDemo
```
