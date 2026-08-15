package com.vibhu.lock.transaction;

import com.vibhu.lock.common.DeadlockException;
import com.vibhu.lock.common.FenceTokenRejectedException;
import com.vibhu.lock.common.IdempotencyConflictException;
import com.vibhu.lock.common.InsufficientFundsException;
import com.vibhu.lock.common.LockTimeoutException;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpStatusCodeException;

@RestControllerAdvice
public class TransactionExceptionHandler {
  @ExceptionHandler(EntityNotFoundException.class)
  ResponseEntity<ApiError> notFound(RuntimeException ex) {
    return error(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<ApiError> badRequest(RuntimeException ex) {
    return error(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  @ExceptionHandler({
    IllegalStateException.class,
    InsufficientFundsException.class,
    FenceTokenRejectedException.class,
    DeadlockException.class,
    IdempotencyConflictException.class
  })
  ResponseEntity<ApiError> conflict(RuntimeException ex) {
    return error(HttpStatus.CONFLICT, ex.getMessage());
  }

  @ExceptionHandler(LockTimeoutException.class)
  ResponseEntity<ApiError> timeout(RuntimeException ex) {
    return error(HttpStatus.REQUEST_TIMEOUT, ex.getMessage());
  }

  @ExceptionHandler(HttpStatusCodeException.class)
  ResponseEntity<ApiError> downstream(HttpStatusCodeException ex) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(
            new ApiError(ex.getStatusCode().value(), ex.getResponseBodyAsString(), Instant.now()));
  }

  private ResponseEntity<ApiError> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ApiError(status.value(), message, Instant.now()));
  }

  record ApiError(int status, String message, Instant timestamp) {}
}
