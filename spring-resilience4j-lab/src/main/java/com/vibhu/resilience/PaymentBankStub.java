package com.vibhu.resilience;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

/**
 * In-memory bank stub — flips modes via {@link #setMode(BankMode)} for demos/tests. Flaky mode
 * fails first N calls then succeeds.
 */
@Component
public class PaymentBankStub {
    private volatile BankMode mode = BankMode.OK;
    private final AtomicInteger calls = new AtomicInteger();
    private volatile int flakyFailCount = 2;

    public void setMode(BankMode mode) {
        this.mode = mode;
        calls.set(0);
    }

    public void setFlakyFailCount(int n) {
        this.flakyFailCount = n;
    }

    public BankMode mode() {
        return mode;
    }

    public int callCount() {
        return calls.get();
    }

    public PaymentResult charge(PayRequest req) {
        int n = calls.incrementAndGet();
        return switch (mode) {
            case OK -> PaymentResult.captured(req.idempotencyKey());
            case ERROR, DOWN -> throw new BankUnavailableException("bank " + mode + " call=" + n);
            case FLAKY -> {
                if (n <= flakyFailCount) {
                    throw new BankUnavailableException("flaky fail #" + n);
                }
                yield PaymentResult.captured(req.idempotencyKey());
            }
            case SLOW -> {
                try {
                    Thread.sleep(3_000);
                } catch (InterruptedException e) {
                    Thread.currentThread()
                            .interrupt();
                    throw new BankUnavailableException("interrupted");
                }
                yield PaymentResult.captured(req.idempotencyKey());
            }
            case REJECT -> throw new BusinessException("insufficient funds");
        };
    }
}
