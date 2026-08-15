package com.example.designpatterns.behavioral.templatemethod;

import java.util.ArrayList;
import java.util.List;

/**
 * PATTERN: Template Method
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
}
