package com.example.designpatterns.structural.composite;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Composite
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
}
