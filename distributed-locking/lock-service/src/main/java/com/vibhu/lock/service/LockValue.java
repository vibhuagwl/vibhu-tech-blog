package com.vibhu.lock.service;

import java.util.Objects;

public record LockValue(String ownerToken, long fencingToken) {
    private static final String SEPARATOR = ":";

    public String encode() {
        return ownerToken + SEPARATOR + fencingToken;
    }

    public boolean matchesOwner(String candidateOwnerToken) {
        return Objects.equals(ownerToken, candidateOwnerToken);
    }

    public static LockValue parse(String encoded) {
        if (encoded == null || encoded.isBlank()) {
            throw new IllegalArgumentException("Lock value must not be blank");
        }
        int separator = encoded.lastIndexOf(SEPARATOR);
        if (separator <= 0 || separator == encoded.length() - 1) {
            throw new IllegalArgumentException("Lock value must use {ownerToken}:{fencingToken} format");
        }
        String ownerToken = encoded.substring(0, separator);
        long fencingToken;
        try {
            fencingToken = Long.parseLong(encoded.substring(separator + 1));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Fencing token must be a long", ex);
        }
        return new LockValue(ownerToken, fencingToken);
    }
}
