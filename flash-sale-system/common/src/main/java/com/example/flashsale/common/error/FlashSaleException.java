package com.example.flashsale.common.error;

public class FlashSaleException extends RuntimeException {
    private final ErrorCode code;

    public FlashSaleException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
