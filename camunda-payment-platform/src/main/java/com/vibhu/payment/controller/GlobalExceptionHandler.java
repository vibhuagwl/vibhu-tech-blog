package com.vibhu.payment.controller;

import com.vibhu.payment.exception.BusinessPaymentException;
import com.vibhu.payment.exception.PaymentException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(PaymentException.class)
  public ResponseEntity<Map<String, String>> payment(PaymentException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "payment_failed", "message", ex.getMessage()));
  }

  @ExceptionHandler(BusinessPaymentException.class)
  public ResponseEntity<Map<String, String>> business(BusinessPaymentException ex) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(Map.of("error", ex.getErrorCode(), "message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "validation_failed", "message", "Invalid request"));
  }

  @ExceptionHandler(UnsupportedOperationException.class)
  public ResponseEntity<Map<String, String>> unsupported(UnsupportedOperationException ex) {
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
        .body(Map.of("error", "not_implemented", "message", ex.getMessage()));
  }
}
