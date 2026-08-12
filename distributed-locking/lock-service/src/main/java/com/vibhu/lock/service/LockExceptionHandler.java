package com.vibhu.lock.service;

import com.vibhu.lock.common.ApiError;
import com.vibhu.lock.common.DeadlockException;
import com.vibhu.lock.common.LockAcquisitionException;
import com.vibhu.lock.common.LockTimeoutException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class LockExceptionHandler {
    @ExceptionHandler(LockTimeoutException.class)
    public ResponseEntity<ApiError> lockTimeout(LockTimeoutException ex, HttpServletRequest request) {
        return error(HttpStatus.REQUEST_TIMEOUT, "LOCK_TIMEOUT", ex.getMessage(), request);
    }

    @ExceptionHandler(DeadlockException.class)
    public ResponseEntity<ApiError> deadlock(DeadlockException ex, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "DEADLOCK_DETECTED", ex.getMessage(), request);
    }

    @ExceptionHandler(LockAcquisitionException.class)
    public ResponseEntity<ApiError> lockAcquisition(LockAcquisitionException ex, HttpServletRequest request) {
        return error(HttpStatus.CONFLICT, "LOCK_ACQUISITION_FAILED", ex.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> badRequest(IllegalArgumentException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request);
    }

    private static ResponseEntity<ApiError> error(HttpStatus status, String code, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(new ApiError(code, message, request.getRequestURI(), Instant.now()));
    }
}
