package com.example.flashsale.flash;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.flash.domain.model.FlashSaleStatus;
import com.example.flashsale.flash.domain.state.FlashSaleContext;
import com.example.flashsale.flash.domain.state.FlashSaleStates;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FlashSaleStatesTest {
    @Test
    void soldOutRejectsPurchase() {
        var ctx = new FlashSaleContext("SALE1001",
                FlashSaleStatus.SOLD_OUT,
                Instant.now(),
                Instant.now(),
                Instant.now());
        assertThatThrownBy(() -> FlashSaleStates.of(FlashSaleStatus.SOLD_OUT)
                .validatePurchase(ctx))
                .isInstanceOf(FlashSaleException.class)
                .extracting(ex -> ((FlashSaleException) ex).code())
                .isEqualTo(ErrorCode.PRODUCT_SOLD_OUT);
    }
}
