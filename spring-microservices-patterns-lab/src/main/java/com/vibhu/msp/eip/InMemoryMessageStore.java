package com.vibhu.msp.eip;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** EIP Claim Check — store large payload externally, pass reference through the bus. */
public final class InMemoryMessageStore {

  private final Map<String, byte[]> store = new ConcurrentHashMap<>();

  public String store(byte[] payload) {
    String claimCheckId = "CC-" + java.util.UUID.randomUUID();
    store.put(claimCheckId, payload);
    return claimCheckId;
  }

  public Optional<byte[]> retrieve(String claimCheckId) {
    return Optional.ofNullable(store.get(claimCheckId));
  }

  public void remove(String claimCheckId) {
    store.remove(claimCheckId);
  }
}
