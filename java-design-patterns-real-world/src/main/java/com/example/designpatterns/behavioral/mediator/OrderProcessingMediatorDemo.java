package com.example.designpatterns.behavioral.mediator;

/**
 * PATTERN: Mediator
 *
 * <p>PROBLEM (without this pattern) - PaymentService calls InventoryService which calls
 * NotificationService directly. - Circular imports and hidden call chains make checkout hard to
 * change. - Adding shipping means editing payment and inventory classes.
 *
 * <p>HOW THIS PATTERN SOLVES IT - OrderProcessingMediator is the only peer colleagues talk through.
 * - placeOrder orchestrates authorize → reserve → notify in one place. - Colleagues no longer
 * reference each other; coupling moves to the mediator.
 *
 * <p>WHEN TO IMPLEMENT - Many colleagues (payment, inventory, shipping) chatter in a mesh of
 * dependencies. - You want one coordinator so services do not reference each other directly.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Colleagues talk only to Mediator; Mediator invokes colleagues —
 * no peer-to-peer calls. 2. Keep mediator orchestration-focused; do not dump all domain logic into
 * it (avoid god mediator). 3. Define clear messages/events the mediator understands. 4. Inject
 * colleagues into mediator for tests; avoid static service locators. 5. Distinguish Mediator
 * (coordinate peers) from Facade (simplify subsystem for outsiders).
 *
 * <p>DO NOT USE WHEN - Only two components interact — a direct dependency is enough.
 */
public class OrderProcessingMediatorDemo {
  public interface Mediator {
    String placeOrder(String orderId);
  }

  public static final class PaymentService {
    String authorize(String orderId) {
      return "payment-ok:" + orderId;
    }
  }

  public static final class InventoryService {
    String reserve(String orderId) {
      return "inventory-ok:" + orderId;
    }
  }

  public static final class NotificationService {
    String notifyCustomer(String orderId) {
      return "notified:" + orderId;
    }
  }

  public static final class OrderProcessingMediator implements Mediator {
    private final PaymentService payment = new PaymentService();
    private final InventoryService inventory = new InventoryService();
    private final NotificationService notification = new NotificationService();

    public String placeOrder(String orderId) {
      payment.authorize(orderId);
      inventory.reserve(orderId);
      notification.notifyCustomer(orderId);
      return "order-complete:" + orderId;
    }
  }

  public static void run() {
    System.out.println("=== Mediator — OrderProcessingMediatorDemo ===");
    System.out.println(
        "PROBLEM: Payment, inventory, and notification services call each other directly, creating"
            + " spaghetti dependencies and circular imports.");
    System.out.println(
        "SOLUTION: OrderProcessingMediator coordinates colleagues; placeOrder runs authorize,"
            + " reserve, and notify so peers never reference each other.");
    System.out.println("STEP 1: Client talks only to OrderProcessingMediator");
    Mediator mediator = new OrderProcessingMediator();
    System.out.println("STEP 2: placeOrder coordinates payment, inventory, and notification");
    System.out.println("STEP 3: Mediator returns single outcome after orchestrating colleagues");
    System.out.println("  Result: " + mediator.placeOrder("order-777"));
  }

  public static void main(String[] args) {
    run();
  }
}
