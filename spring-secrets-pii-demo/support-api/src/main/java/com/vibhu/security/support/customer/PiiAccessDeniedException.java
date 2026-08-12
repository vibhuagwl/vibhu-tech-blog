package com.vibhu.security.support.customer;

public class PiiAccessDeniedException extends RuntimeException {

    public PiiAccessDeniedException(String message) {
        super(message);
    }
}
