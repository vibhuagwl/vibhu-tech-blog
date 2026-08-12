package com.vibhu.security.pii.customer;

public class PiiAccessDeniedException extends RuntimeException {

    public PiiAccessDeniedException(String message) {
        super(message);
    }
}
