package com.vibhu.msp.lb;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

/** Consistent hash ring — same key always maps to the same node (until ring changes). */
public final class ConsistentHashLoadBalancer<T> implements LoadBalancer<T> {

    private final List<T> ring;

    public ConsistentHashLoadBalancer(List<T> ring) {
        if (ring == null || ring.isEmpty()) {
            throw new IllegalArgumentException("Ring must not be empty");
        }
        this.ring = List.copyOf(ring);
    }

    public T selectForKey(String key) {
        int hash = hash(key);
        int index = Math.floorMod(hash, ring.size());
        return ring.get(index);
    }

    @Override
    public T select(List<T> candidates) {
        return selectForKey(String.valueOf(System.nanoTime()));
    }

    static int hash(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return ((bytes[0] & 0xFF) << 24) | ((bytes[1] & 0xFF) << 16)
                    | ((bytes[2] & 0xFF) << 8) | (bytes[3] & 0xFF);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
