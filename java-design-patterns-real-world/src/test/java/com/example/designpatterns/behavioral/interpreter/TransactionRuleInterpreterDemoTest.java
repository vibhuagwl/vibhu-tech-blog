package com.example.designpatterns.behavioral.interpreter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TransactionRuleInterpreterDemoTest {
  @Test
  void shouldInterpretSimpleTransactionRule() {
    var expression = TransactionRuleInterpreterDemo.parse("AMOUNT > 10000 AND COUNTRY == \"IN\"");
    assertThat(expression.interpret(new TransactionRuleInterpreterDemo.Transaction(20000, "IN")))
        .isTrue();
  }
}
