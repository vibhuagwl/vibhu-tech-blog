package com.example.flashsale.flash.domain.state;

import com.example.flashsale.common.error.ErrorCode;
import com.example.flashsale.common.error.FlashSaleException;
import com.example.flashsale.flash.domain.model.FlashSaleStatus;

public final class FlashSaleStates {
    private FlashSaleStates() {
    }

    public static FlashSaleState of(FlashSaleStatus status) {
        return switch (status) {
            case ACTIVE -> new ActiveState();
            case SCHEDULED, CREATED -> new ScheduledState();
            case SOLD_OUT -> new SoldOutState();
            case ENDED -> new EndedState();
            case CANCELLED -> new CancelledState();
        };
    }

    static final class ActiveState implements FlashSaleState {
        @Override
        public void validatePurchase(FlashSaleContext context) {
            if (context.now()
                    .isBefore(context.startsAt()) || !context.now()
                    .isBefore(context.endsAt())) {
                throw new FlashSaleException(ErrorCode.SALE_NOT_ACTIVE, "Sale window closed");
            }
        }

        @Override
        public FlashSaleStatus status() {
            return FlashSaleStatus.ACTIVE;
        }
    }

    static final class ScheduledState implements FlashSaleState {
        @Override
        public void validatePurchase(FlashSaleContext context) {
            throw new FlashSaleException(ErrorCode.SALE_NOT_ACTIVE, "Sale not started");
        }

        @Override
        public FlashSaleStatus status() {
            return FlashSaleStatus.SCHEDULED;
        }
    }

    static final class SoldOutState implements FlashSaleState {
        @Override
        public void validatePurchase(FlashSaleContext context) {
            throw new FlashSaleException(ErrorCode.PRODUCT_SOLD_OUT, "Sold out");
        }

        @Override
        public FlashSaleStatus status() {
            return FlashSaleStatus.SOLD_OUT;
        }
    }

    static final class EndedState implements FlashSaleState {
        @Override
        public void validatePurchase(FlashSaleContext context) {
            throw new FlashSaleException(ErrorCode.SALE_ENDED, "Sale ended");
        }

        @Override
        public FlashSaleStatus status() {
            return FlashSaleStatus.ENDED;
        }
    }

    static final class CancelledState implements FlashSaleState {
        @Override
        public void validatePurchase(FlashSaleContext context) {
            throw new FlashSaleException(ErrorCode.SALE_NOT_ACTIVE, "Sale cancelled");
        }

        @Override
        public FlashSaleStatus status() {
            return FlashSaleStatus.CANCELLED;
        }
    }
}
