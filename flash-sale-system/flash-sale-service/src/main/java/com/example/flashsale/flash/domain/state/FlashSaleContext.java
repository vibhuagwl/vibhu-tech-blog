package com.example.flashsale.flash.domain.state;

import com.example.flashsale.flash.domain.model.FlashSaleStatus;

import java.time.Instant;

public record FlashSaleContext(String saleId, FlashSaleStatus status, Instant now, Instant startsAt, Instant endsAt) {
}
