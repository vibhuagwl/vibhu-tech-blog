package com.example.payment.service;

import com.example.payment.dto.PaymentEventDto;
import com.example.payment.entity.Payment;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class PaymentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventPublisher.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(ex -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    public void publish(Payment payment) {
        PaymentEventDto event = new PaymentEventDto(
                payment.getId(),
                payment.getReference(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCurrency(),
                Instant.now()
        );
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("payment-status").data(event));
            } catch (Exception ex) {
                log.debug("Removing stale SSE emitter: {}", ex.getMessage());
                emitters.remove(emitter);
                try {
                    emitter.completeWithError(ex);
                } catch (Exception ignored) {
                    // ignore
                }
            }
        }
    }
}
