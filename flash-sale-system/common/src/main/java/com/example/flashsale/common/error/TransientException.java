package com.example.flashsale.common.error;

/**
 * Safe to retry (deadlock, momentary network).
 */
public class TransientException extends FlashSaleException {
    public TransientException(ErrorCode code, String message) {
        super(code, message);
    }
}
