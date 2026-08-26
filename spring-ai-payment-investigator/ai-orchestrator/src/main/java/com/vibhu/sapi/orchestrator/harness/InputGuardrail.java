package com.vibhu.sapi.orchestrator.harness;

import com.vibhu.sapi.exception.PromptInjectionException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class InputGuardrail {

    private static final List<String> BLOCKED = List.of("ignore previous instructions",
            "ignore all instructions",
            "refund everyone",
            "refund all customers",
            "disable security",
            "you are now",
            "payment.execute",
            "execute payment without approval");

    public void validate(String userMessage) {
        if (userMessage == null) {
            return;
        }
        String lower = userMessage.toLowerCase(Locale.ROOT);
        for (String phrase : BLOCKED) {
            if (lower.contains(phrase)) {
                throw new PromptInjectionException("Blocked prompt injection pattern: " + phrase);
            }
        }
    }
}
