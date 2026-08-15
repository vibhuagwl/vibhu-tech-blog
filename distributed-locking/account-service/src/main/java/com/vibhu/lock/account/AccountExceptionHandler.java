package com.vibhu.lock.account;

import com.vibhu.lock.common.FenceTokenRejectedException;
import com.vibhu.lock.common.InsufficientFundsException;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AccountExceptionHandler {
  @ExceptionHandler(EntityNotFoundException.class)
  ResponseEntity<ApiError> notFound(RuntimeException ex) {
    return error(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler({InsufficientFundsException.class, FenceTokenRejectedException.class})
  ResponseEntity<ApiError> conflict(RuntimeException ex) {
    return error(HttpStatus.CONFLICT, ex.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<ApiError> badRequest(RuntimeException ex) {
    return error(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  private ResponseEntity<ApiError> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ApiError(status.value(), message, Instant.now()));
  }

  record ApiError(int status, String message, Instant timestamp) {}
}
