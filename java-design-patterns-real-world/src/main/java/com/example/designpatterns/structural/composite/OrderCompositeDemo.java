package com.example.designpatterns.structural.composite;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Composite
 *
 * <p>INTERVIEW RULE — Don't start with the pattern name. Start with the problem, then show how
 * Composite solves it. Full board: {@code docs/composite-problem-solution.md}.
 *
 * <p>PROBLEM (without this pattern) - An order is a tree: products, bundles, and bundles inside
 * bundles. - Client must ask "is this a Product or a Bundle?" with {@code instanceof}, then nest
 * loops for nested bundles. - Leaf and group are not treated uniformly; every new operation (total,
 * discount, tax) rewrites tree-walking in the client.
 *
 * <p>HOW THIS PATTERN SOLVES IT - {@code OrderComponent} is the common interface for leaf and
 * composite. - {@code Product} (leaf) returns its own price from {@code total()}. - {@code Bundle}
 * (composite) holds {@code List<OrderComponent>} and recursively sums {@code child.total()}. -
 * Client only calls {@code order.total()} — it never walks the tree or checks types.
 *
 * <p>FORMULA - Problem: Leaf + Group + nested groups → client logic becomes complex. - Solution:
 * Common interface + Composite contains same interface → recursive delegation. - Benefit: Client
 * treats single object and group of objects the same way.
 *
 * <p>WHEN TO IMPLEMENT - You treat individual objects and groups uniformly (line items, bundles,
 * nested order sections). - Tree structures where clients call the same operation on leaves and
 * composites.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Define a common Component interface used by both Leaf and
 * Composite. 2. Composite stores children as List&lt;Component&gt; and delegates operations (total,
 * validate) recursively. 3. Decide whether child management methods live on Component or only on
 * Composite (transparency vs safety). 4. Guard against cycles when adding children. 5. Keep leaf
 * operations meaningful; avoid empty no-ops that hide misuse.
 *
 * <p>DO NOT USE WHEN - Flat lists with no nesting — a simple collection + loop is clearer.
 */
public class OrderCompositeDemo {
  public interface OrderComponent {
    int total();
  }

  /** Leaf — calculates its own total. */
  public record Product(String sku, int price) implements OrderComponent {
    public int total() {
      return price;
    }
  }

  /** Composite — asks each child for its total (recursion hides the tree from the client). */
  public static final class Bundle implements OrderComponent {
    private final List<OrderComponent> children = new ArrayList<>();

    public Bundle add(OrderComponent component) {
      children.add(component);
      return this;
    }

    public int total() {
      return children.stream().mapToInt(OrderComponent::total).sum();
    }
  }

  public static void run() {
    System.out.println("=== Composite — OrderCompositeDemo ===");
    System.out.println();
    System.out.println("1) PROBLEM — What are we solving?");
    System.out.println(
        "   Order can hold products, bundles, and nested bundles. How does the client");
    System.out.println(
        "   calculate total WITHOUT knowing whether an item is a Product or a Bundle?");
    System.out.println(
        """
           Order
           ├── Laptop             1000
           ├── Mouse                50
           └── Gaming Bundle
               ├── Keyboard        200
               └── Headset         300
        """);

    System.out.println("2) WITHOUT Composite — client owns the tree");
    System.out.println("   if (item instanceof Product) { ... }");
    System.out.println(
        "   if (item instanceof Bundle) { loop children; if child Bundle → nest again }");
    System.out.println("   Pain: instanceof, nested loops, client understands the whole tree.");
    System.out.println();

    System.out.println("3) WITH Composite — common interface + recursive delegation");
    System.out.println("   OrderComponent.total() works for Product AND Bundle.");
    System.out.println();

    System.out.println("STEP 1: Build leaves (Product calculates its own total)");
    Product laptop = new Product("LAPTOP", 1000);
    Product mouse = new Product("MOUSE", 50);
    Product keyboard = new Product("KEYBOARD", 200);
    Product headset = new Product("HEADSET", 300);
    System.out.println("  laptop.total()  = " + laptop.total());
    System.out.println("  mouse.total()   = " + mouse.total());

    System.out.println("STEP 2: Build nested composites (Bundle asks children for total)");
    Bundle gamingBundle = new Bundle().add(keyboard).add(headset);
    Bundle order = new Bundle().add(laptop).add(mouse).add(gamingBundle);
    System.out.println(
        """
           order (Bundle)
           ├── laptop (Product)           → 1000
           ├── mouse (Product)            → 50
           └── gamingBundle (Bundle)
               ├── keyboard (Product)     → 200
               └── headset (Product)      → 300
        """);

    System.out.println("STEP 3: Client treats the tree as one OrderComponent — no instanceof");
    OrderComponent cart = order;
    int total = cart.total();
    System.out.println("  cart.total() = " + total + "  (expected 1550 = 1000+50+200+300)");
    System.out.println();
    System.out.println("  Recursion hidden inside Composite:");
    System.out.println("    order.total()");
    System.out.println("      ├── laptop.total()        → 1000");
    System.out.println("      ├── mouse.total()         → 50");
    System.out.println("      └── gamingBundle.total()");
    System.out.println("            ├── keyboard.total() → 200");
    System.out.println("            └── headset.total()  → 300");
    System.out.println();
    System.out.println("FORMULA: Leaf+Group+nesting → common interface + recursive Bundle.total()");
    System.out.println("BENEFIT: Client never walks the tree; Composite does.");
  }

  public static void main(String[] args) {
    run();
  }
}
