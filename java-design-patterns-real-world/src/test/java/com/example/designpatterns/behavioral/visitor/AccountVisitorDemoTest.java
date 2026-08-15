package com.example.designpatterns.behavioral.visitor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AccountVisitorDemoTest {
  @Test
  void shouldAddOperationsWithoutChangingAccountClasses() {
    var visitor = new AccountVisitorDemo.InterestCalculationVisitor();
    assertThat(new AccountVisitorDemo.SavingsAccount(1000).accept(visitor)).isEqualTo(40.0);
  }
}
