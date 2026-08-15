package com.example.designpatterns.behavioral.memento;

/**
 * PATTERN: Memento
 *
 * <p>PROBLEM (without this pattern) - Ops edits gateway from STRIPE to ADYEN and cannot undo a bad
 * change. - Exposing PaymentConfiguration fields for rollback breaks encapsulation. - Support needs
 * snapshot/restore without serializing the whole service.
 *
 * <p>HOW THIS PATTERN SOLVES IT - save() captures an opaque Snapshot memento of gateway and
 * timeout. - restore(snapshot) puts configuration back without public field access. - Caretaker
 * stores mementos; originator controls what is inside the snapshot.
 *
 * <p>WHEN TO IMPLEMENT - You must save/restore object state (undo config edits, rollback wizard)
 * without breaking encapsulation. - External caretaker stores snapshots but must not poke into
 * private fields.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Originator creates opaque Memento; Caretaker stores mementos but
 * does not inspect fields. 2. Prefer nested/private memento types or records package-private to
 * Originator. 3. Snapshots should be immutable deep enough for undo correctness. 4. Limit history
 * size (stack cap) to avoid memory leaks. 5. Do not use Memento as a general persistence model — it
 * is for short-lived undo/restore.
 *
 * <p>DO NOT USE WHEN - You only need database persistence of an entity — use normal
 * serialization/ORM.
 */
public class PaymentConfigurationMementoDemo {
  public record Snapshot(String gateway, int timeoutSeconds) {}

  public static final class PaymentConfiguration {
    private String gateway;
    private int timeoutSeconds;

    public PaymentConfiguration(String gateway, int timeoutSeconds) {
      this.gateway = gateway;
      this.timeoutSeconds = timeoutSeconds;
    }

    public Snapshot save() {
      return new Snapshot(gateway, timeoutSeconds);
    }

    public void restore(Snapshot snapshot) {
      this.gateway = snapshot.gateway();
      this.timeoutSeconds = snapshot.timeoutSeconds();
    }

    public String gateway() {
      return gateway;
    }
  }

  public static void run() {
    System.out.println("=== Memento — PaymentConfigurationMementoDemo ===");
    System.out.println(
        "PROBLEM: Ops cannot undo a bad gateway or timeout edit without exposing"
            + " PaymentConfiguration internals or redeploying from backup.");
    System.out.println(
        "SOLUTION: save() captures an opaque Snapshot; restore() rolls back gateway and timeout"
            + " without leaking private fields to the caretaker.");
    System.out.println("STEP 1: Start with gateway=STRIPE, timeout=30");
    var config = new PaymentConfiguration("STRIPE", 30);
    System.out.println("  Initial gateway: " + config.gateway());
    System.out.println("STEP 2: save() captures opaque Snapshot (memento)");
    Snapshot snapshot = config.save();
    System.out.println("STEP 3: Change config, then restore(snapshot) for undo");
    config = new PaymentConfiguration("ADYEN", 60);
    System.out.println("  After edit: " + config.gateway());
    config.restore(snapshot);
    System.out.println("  After restore: " + config.gateway());
  }

  public static void main(String[] args) {
    run();
  }
}
