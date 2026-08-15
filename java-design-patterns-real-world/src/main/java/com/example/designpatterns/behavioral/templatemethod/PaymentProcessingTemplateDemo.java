package com.example.designpatterns.behavioral.templatemethod;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Template Method
 *
 * <p>PROBLEM (without this pattern) - Card and UPI flows duplicate validate → authenticate →
 * process → audit → notify. - A team reordering steps in one rail forgets the same fix in the
 * other. - Only the middle "process" step truly differs between payment types.
 *
 * <p>HOW THIS PATTERN SOLVES IT - PaymentProcessor.execute() is a final template fixing step order.
 * - CardProcessor and UpiProcessor override only the process() hook. - Shared steps stay in the
 * base class; subclasses cannot skip audit or notify.
 *
 * <p>WHEN TO IMPLEMENT - Algorithm skeleton is fixed (validate → authorize → capture → notify) but
 * steps vary by subclass. - You need to enforce sequencing while allowing hooks.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Abstract class defines {@code final} template method calling
 * overridable steps in order. 2. Mark invariant steps final; mark extension points protected
 * abstract or hook methods with defaults. 3. Subclasses override only hooks — never rewrite the
 * skeleton order. 4. Prefer composition (Strategy) if variation is large and inheritance depth
 * grows. 5. Avoid public overridable methods that break the template contract.
 *
 * <p>DO NOT USE WHEN - Steps are independently swappable policies — Strategy/Chain may be clearer
 * than inheritance.
 */
public class PaymentProcessingTemplateDemo {
  public abstract static class PaymentProcessor {
    public final List<String> execute() {
      List<String> steps = new ArrayList<>();
      validate(steps);
      authenticate(steps);
      process(steps);
      audit(steps);
      notifyCustomer(steps);
      return steps;
    }

    protected void validate(List<String> steps) {
      steps.add("validate");
    }

    protected void authenticate(List<String> steps) {
      steps.add("authenticate");
    }

    protected abstract void process(List<String> steps);

    protected void audit(List<String> steps) {
      steps.add("audit");
    }

    protected void notifyCustomer(List<String> steps) {
      steps.add("notify");
    }
  }

  public static final class CardProcessor extends PaymentProcessor {
    protected void process(List<String> steps) {
      steps.add("process-card");
    }
  }

  public static final class UpiProcessor extends PaymentProcessor {
    protected void process(List<String> steps) {
      steps.add("process-upi");
    }
  }

  public static void run() {
    System.out.println("=== Template Method — PaymentProcessingTemplateDemo ===");
    System.out.println(
        "PROBLEM: Card and UPI payment flows copy the same validate-authenticate-audit-notify"
            + " pipeline, risking drift when only the process step should differ.");
    System.out.println(
        "SOLUTION: PaymentProcessor.execute() defines a final template; CardProcessor and"
            + " UpiProcessor override only process() while shared steps stay fixed in order.");
    System.out.println("STEP 1: CardProcessor defines fixed skeleton with card-specific process()");
    var cardSteps = new CardProcessor().execute();
    System.out.println("  Card steps: " + cardSteps);
    System.out.println("STEP 2: UpiProcessor overrides only the process hook");
    var upiSteps = new UpiProcessor().execute();
    System.out.println("  UPI steps: " + upiSteps);
    System.out.println("STEP 3: Skeleton order stays identical; only middle step varies");
  }

  public static void main(String[] args) {
    run();
  }
}
