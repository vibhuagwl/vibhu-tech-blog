package com.example.designpatterns.behavioral.templatemethod;

import java.util.ArrayList;
import java.util.List;

public class PaymentProcessingTemplateDemo {
    public abstract static class PaymentProcessor {
        public final List<String> execute(){
            List<String> steps = new ArrayList<>();
            validate(steps); authenticate(steps); process(steps); audit(steps); notifyCustomer(steps); return steps;
        }
        protected void validate(List<String> steps){ steps.add("validate"); }
        protected void authenticate(List<String> steps){ steps.add("authenticate"); }
        protected abstract void process(List<String> steps);
        protected void audit(List<String> steps){ steps.add("audit"); }
        protected void notifyCustomer(List<String> steps){ steps.add("notify"); }
    }
    public static final class CardProcessor extends PaymentProcessor { protected void process(List<String> steps){ steps.add("process-card"); } }
    public static final class UpiProcessor extends PaymentProcessor { protected void process(List<String> steps){ steps.add("process-upi"); } }
}
