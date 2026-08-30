package com.example.flashsale.common.error;

/**
 * Do not retry. Poison / bad schema / business reject already recorded.
 */
public class PermanentException extends FlashSaleException {
    public PermanentException(ErrorCode code, String message) {
        super(code, message);
    }
}
