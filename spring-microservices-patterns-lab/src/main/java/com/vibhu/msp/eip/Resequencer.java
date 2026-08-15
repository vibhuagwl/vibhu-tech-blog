package com.vibhu.msp.eip;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** EIP Resequencer — reorder out-of-order messages by sequence number. */
public final class Resequencer<T> {

  public record SequencedMessage<T>(long sequence, T payload) {}

  private final Map<Long, T> buffer = new ConcurrentHashMap<>();
  private long nextExpected = 1;

  public List<T> accept(SequencedMessage<T> message) {
    buffer.put(message.sequence(), message.payload());
    return drainReady();
  }

  public List<T> drainReady() {
    List<T> ready = new ArrayList<>();
    while (buffer.containsKey(nextExpected)) {
      ready.add(buffer.remove(nextExpected));
      nextExpected++;
    }
    return ready;
  }

  public List<T> acceptAll(List<SequencedMessage<T>> messages) {
    messages.stream()
        .sorted(Comparator.comparingLong(SequencedMessage::sequence))
        .forEach(m -> buffer.put(m.sequence(), m.payload()));
    return drainReady();
  }

  public long nextExpected() {
    return nextExpected;
  }
}
