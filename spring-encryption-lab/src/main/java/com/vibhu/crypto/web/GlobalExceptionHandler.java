package com.vibhu.crypto.web;

import com.vibhu.crypto.exception.CryptoException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Never leak plaintext, keys, or stack traces to API clients. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(CryptoException.class)
  public ResponseEntity<Map<String, String>> crypto(CryptoException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("error", "crypto_failed", "message", "Request rejected"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "validation_failed", "message", "Invalid request"));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> illegal(IllegalArgumentException ex) {
    return ResponseEntity.badRequest()
        .body(Map.of("error", "bad_request", "message", "Invalid request"));
  }
}
