package com.vibhu.msp.eip;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResequencerTest {

  @Test
  void reordersOutOfOrderMessages() {
    Resequencer<String> resequencer = new Resequencer<>();

    assertTrue(resequencer.accept(new Resequencer.SequencedMessage<>(3L, "third")).isEmpty());
    assertEquals(List.of("first"), resequencer.accept(new Resequencer.SequencedMessage<>(1L, "first")));

    List<String> ready = resequencer.accept(new Resequencer.SequencedMessage<>(2L, "second"));
    assertEquals(List.of("second", "third"), ready);
    assertEquals(4L, resequencer.nextExpected());
  }

  @Test
  void acceptAll_drainsInOrder() {
    Resequencer<Integer> resequencer = new Resequencer<>();
    List<Resequencer.SequencedMessage<Integer>> batch = List.of(
        new Resequencer.SequencedMessage<>(2, 20),
        new Resequencer.SequencedMessage<>(1, 10),
        new Resequencer.SequencedMessage<>(3, 30)
    );
    List<Integer> result = resequencer.acceptAll(batch);
    assertEquals(List.of(10, 20, 30), result);
  }
}
