package com.example.designpatterns.structural.composite;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Composite
 *
 * <p>PROBLEM (without this pattern) - Checkout must price individual products and promotional
 * bundles differently. - Cart total logic branches on "is this a bundle?" at every level of
 * nesting. - Adding nested bundles (gift set inside mega-bundle) duplicates summation code.
 *
 * <p>HOW THIS PATTERN SOLVES IT - Product (leaf) and Bundle (composite) both implement
 * OrderComponent.total(). - Bundle recursively sums children; callers call total() uniformly. -
 * Nested bundles work without special-case pricing loops.
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

  public record Product(String sku, int price) implements OrderComponent {
    public int total() {
      return price;
    }
  }

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
    System.out.println(
        "PROBLEM: Checkout treats single products and bundles with separate total() logic, so"
            + " nested bundles and mixed carts need special-case summation code.");
    System.out.println(
        "SOLUTION: Product and Bundle both implement OrderComponent; Bundle.total() recursively"
            + " sums children so any cart shape uses one uniform call.");
    System.out.println("STEP 1: Create leaf Product line items");
    var book = new Product("book-101", 20);
    var bag = new Product("bag-202", 80);
    System.out.println("STEP 2: Add products to a Bundle composite");
    var bundle = new Bundle().add(book).add(bag);
    System.out.println("STEP 3: Call total() uniformly on the bundle (delegates to children)");
    System.out.println("  Bundle total: " + bundle.total());
  }

  public static void main(String[] args) {
    run();
  }
}
