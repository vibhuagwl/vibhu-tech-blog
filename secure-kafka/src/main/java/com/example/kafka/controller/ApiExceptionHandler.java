package com.example.kafka.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletionException;
import org.apache.kafka.common.errors.GroupAuthorizationException;
import org.apache.kafka.common.errors.SaslAuthenticationException;
import org.apache.kafka.common.errors.SslAuthenticationException;
import org.apache.kafka.common.errors.TopicAuthorizationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(CompletionException.class)
    public ResponseEntity<Map<String, Object>> asyncFailure(CompletionException ex) {
        Throwable cause = ex.getCause() == null ? ex : ex.getCause();
        if (cause instanceof SaslAuthenticationException sasl) {
            return invalidToken(sasl);
        }
        if (cause instanceof SslAuthenticationException ssl) {
            return tlsFailure(ssl);
        }
        if (cause instanceof TopicAuthorizationException || cause instanceof GroupAuthorizationException) {
            return kafkaForbidden((RuntimeException) cause);
        }
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Payment publish failed", ex);
    }

    @ExceptionHandler(SaslAuthenticationException.class)
    public ResponseEntity<Map<String, Object>> invalidToken(SaslAuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Kafka authentication failed (invalid or expired OAuth token)", ex);
    }

    @ExceptionHandler(SslAuthenticationException.class)
    public ResponseEntity<Map<String, Object>> tlsFailure(SslAuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Kafka TLS handshake failed", ex);
    }

    @ExceptionHandler({TopicAuthorizationException.class, GroupAuthorizationException.class})
    public ResponseEntity<Map<String, Object>> kafkaForbidden(RuntimeException ex) {
        return error(HttpStatus.FORBIDDEN, "Kafka ACL denied the requested topic or consumer group", ex);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalidBody(MethodArgumentNotValidException ex) {
        return error(HttpStatus.BAD_REQUEST, "Validation failed", ex);
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message, Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("detail", ex.getMessage());
        return ResponseEntity.status(status).body(body);
    }
}
