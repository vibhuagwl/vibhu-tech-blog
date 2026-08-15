package com.vibhu.security.jwt.exception;

import com.vibhu.security.jwt.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(DuplicateUserException.class)
  ResponseEntity<ApiError> duplicate(DuplicateUserException ex, HttpServletRequest request) {
    return error(HttpStatus.CONFLICT, ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidTokenException.class)
  ResponseEntity<ApiError> token(InvalidTokenException ex, HttpServletRequest request) {
    return error(HttpStatus.UNAUTHORIZED, "Invalid or expired token", request);
  }

  @ExceptionHandler(TooManyLoginAttemptsException.class)
  ResponseEntity<ApiError> locked(TooManyLoginAttemptsException ex, HttpServletRequest request) {
    return error(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), request);
  }

  @ExceptionHandler({BadCredentialsException.class, DisabledException.class, LockedException.class})
  ResponseEntity<ApiError> badCredentials(AuthenticationException ex, HttpServletRequest request) {
    return error(HttpStatus.UNAUTHORIZED, "Invalid email or password", request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> validation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    FieldError field = ex.getBindingResult().getFieldError();
    String message = field == null ? "Invalid request" : field.getField() + " is invalid";
    return error(HttpStatus.BAD_REQUEST, message, request);
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> fallback(Exception ex, HttpServletRequest request) {
    log.error(
        "Unhandled error path={} type={}", request.getRequestURI(), ex.getClass().getSimpleName());
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error", request);
  }

  private static ResponseEntity<ApiError> error(
      HttpStatus status, String message, HttpServletRequest request) {
    ApiError body =
        new ApiError(
            Instant.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            request.getRequestURI(),
            MDC.get("requestId"));
    return ResponseEntity.status(status).body(body);
  }
}
