package com.example.designpatterns.behavioral.templatemethod;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class PaymentProcessingTemplateDemoTest {
    @Test void shouldKeepWorkflowStableAndLetStepVary() {
        assertThat(new PaymentProcessingTemplateDemo.CardProcessor().execute()).containsSequence("validate", "authenticate", "process-card", "audit", "notify");
    }
}
