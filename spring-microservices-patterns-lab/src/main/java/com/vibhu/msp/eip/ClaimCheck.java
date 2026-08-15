package com.vibhu.msp.eip;

/** Claim Check pattern facade over message store. */
public final class ClaimCheck {

  private final InMemoryMessageStore store;

  public ClaimCheck(InMemoryMessageStore store) {
    this.store = store;
  }

  public record ClaimReference(String id, int sizeBytes) {}

  public ClaimReference checkIn(byte[] payload) {
    String id = store.store(payload);
    return new ClaimReference(id, payload.length);
  }

  public byte[] checkOut(ClaimReference reference) {
    return store
        .retrieve(reference.id())
        .orElseThrow(() -> new IllegalArgumentException("Unknown claim check: " + reference.id()));
  }
}
