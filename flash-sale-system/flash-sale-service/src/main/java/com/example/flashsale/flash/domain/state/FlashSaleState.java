package com.example.flashsale.flash.domain.state;

import com.example.flashsale.flash.domain.model.FlashSaleStatus;

public interface FlashSaleState {
    void validatePurchase(FlashSaleContext context);

    FlashSaleStatus status();
}
