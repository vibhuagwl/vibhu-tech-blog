package com.example.payment.controller;

import com.example.payment.service.PaymentEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/events")
public class SseController {

    private final PaymentEventPublisher eventPublisher;

    public SseController(PaymentEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @GetMapping(path = "/payments", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter payments() {
        return eventPublisher.subscribe();
    }
}
