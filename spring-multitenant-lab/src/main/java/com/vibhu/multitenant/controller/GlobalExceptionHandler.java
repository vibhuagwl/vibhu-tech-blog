package com.vibhu.multitenant.controller;

import com.vibhu.multitenant.exception.MultiTenantException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MultiTenantException.class)
  public ResponseEntity<Map<String, String>> handle(MultiTenantException ex) {
    return ResponseEntity.status(ex.httpStatus())
        .body(Map.of("error", ex.code(), "message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "validation_failed", "message", ex.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> illegal(IllegalArgumentException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "bad_request", "message", ex.getMessage()));
  }
}
