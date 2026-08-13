package com.vibhu.hadron.web;

import com.vibhu.hadron.dto.ErrorResponse;
import com.vibhu.hadron.exception.ReplayConflictException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ReplayConflictException.class)
  public ResponseEntity<ErrorResponse> conflict(ReplayConflictException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(new ErrorResponse("replay_conflict", ex.getMessage(), request.getHeader("X-Correlation-Id")));
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
  public ResponseEntity<ErrorResponse> validation(Exception ex, HttpServletRequest request) {
    return ResponseEntity.badRequest()
        .body(new ErrorResponse("validation_failed", ex.getMessage(), request.getHeader("X-Correlation-Id")));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> other(Exception ex, HttpServletRequest request) {
    log.warn("API failure type={}", ex.getClass().getName());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ErrorResponse("internal_error", ex.getClass().getSimpleName(), request.getHeader("X-Correlation-Id")));
  }
}
