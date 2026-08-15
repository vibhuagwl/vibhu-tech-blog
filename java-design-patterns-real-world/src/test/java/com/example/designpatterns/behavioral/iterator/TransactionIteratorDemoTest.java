package com.example.designpatterns.behavioral.iterator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class TransactionIteratorDemoTest {
  @Test
  void shouldTraverseWithoutExposingInternalCollection() {
    int total = 0;
    for (var t :
        new TransactionIteratorDemo.TransactionRepository(
            List.of(
                new TransactionIteratorDemo.Transaction("a", 10),
                new TransactionIteratorDemo.Transaction("b", 20)))) total += t.amount();
    assertThat(total).isEqualTo(30);
  }
}
