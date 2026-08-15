package com.vibhu.resilience;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import java.time.Duration;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@SpringBootTest
class PatternResilienceTest {

  @Autowired FxRateService fx;
  @Autowired PaymentGatewayClient client;
  @Autowired PaymentBankStub bank;
  @Autowired CircuitBreakerRegistry circuitBreakerRegistry;

  @Test
  void cache_second_call_does_not_hit_bank() {
    int before = fx.bankHits();
    fx.usdInr();
    fx.usdInr();
    assertThat(fx.bankHits()).isEqualTo(before + 1);
  }

  @Test
  void business_reject_does_not_open_circuit() {
    bank.setMode(BankMode.REJECT);
    CircuitBreaker cb = circuitBreakerRegistry.circuitBreaker("payment");
    cb.reset();
    for (int i = 0; i < 12; i++) {
      try {
        client.charge(new PayRequest("biz-" + i, "c1", 1));
      } catch (BusinessException ignored) {
        // expected — ignoreExceptions on CB
      }
    }
    assertThat(cb.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    bank.setMode(BankMode.OK);
  }

  @Test
  void rate_limiter_rejects_burst() {
    RateLimiter rl =
        RateLimiter.of(
            "burst",
            RateLimiterConfig.custom()
                .limitForPeriod(2)
                .limitRefreshPeriod(Duration.ofSeconds(30))
                .timeoutDuration(Duration.ZERO)
                .build());
    assertThat(RateLimiter.decorateSupplier(rl, () -> "ok").get()).isEqualTo("ok");
    assertThat(RateLimiter.decorateSupplier(rl, () -> "ok").get()).isEqualTo("ok");
    assertThatThrownBy(() -> RateLimiter.decorateSupplier(rl, () -> "ok").get())
        .isInstanceOf(RequestNotPermitted.class);
  }

  @Test
  void semaphore_bulkhead_rejects_when_full() throws Exception {
    Bulkhead bh =
        Bulkhead.of(
            "full",
            BulkheadConfig.custom().maxConcurrentCalls(1).maxWaitDuration(Duration.ZERO).build());
    bh.acquirePermission();
    assertThatThrownBy(() -> Bulkhead.decorateSupplier(bh, () -> "x").get())
        .isInstanceOf(BulkheadFullException.class);
    bh.releasePermission();
  }

  @Test
  void time_limiter_times_out_slow_future() {
    TimeLimiter tl =
        TimeLimiter.of(TimeLimiterConfig.custom().timeoutDuration(Duration.ofMillis(50)).build());
    Callable<String> slow =
        TimeLimiter.decorateFutureSupplier(
            tl,
            () ->
                CompletableFuture.supplyAsync(
                    () -> {
                      try {
                        Thread.sleep(400);
                      } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                      }
                      return "late";
                    }));
    assertThatThrownBy(slow::call).isInstanceOf(TimeoutException.class);
  }

  @Test
  void retry_ignores_business_exception() {
    AtomicInteger attempts = new AtomicInteger();
    var retry =
        io.github.resilience4j.retry.Retry.of(
            "biz",
            io.github.resilience4j.retry.RetryConfig.custom()
                .maxAttempts(3)
                .retryExceptions(BankUnavailableException.class)
                .ignoreExceptions(BusinessException.class)
                .build());
    assertThatThrownBy(
            () ->
                io.github.resilience4j.retry.Retry.decorateSupplier(
                        retry,
                        () -> {
                          attempts.incrementAndGet();
                          throw new BusinessException("no funds");
                        })
                    .get())
        .isInstanceOf(BusinessException.class);
    assertThat(attempts.get()).isEqualTo(1);
  }

  @Test
  void reactive_timeout_falls_back_to_pending() {
    StepVerifier.create(BankReactiveClient.charge(Mono.error(new BankUnavailableException("down"))))
        .expectNext("PENDING")
        .verifyComplete();
  }

  @Test
  void programmatic_pipeline_succeeds() {
    PaymentResult r =
        ProgrammaticDecorators.paymentPipeline(() -> PaymentResult.captured("pipe")).get();
    assertThat(r.status()).isEqualTo("CAPTURED");
  }
}
