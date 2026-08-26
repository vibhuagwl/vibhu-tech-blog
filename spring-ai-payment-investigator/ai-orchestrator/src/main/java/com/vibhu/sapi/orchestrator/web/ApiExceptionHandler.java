package com.vibhu.sapi.orchestrator.web;

import com.vibhu.sapi.exception.ApprovalRequiredException;
import com.vibhu.sapi.exception.PromptInjectionException;
import com.vibhu.sapi.exception.StructuredOutputValidationException;
import com.vibhu.sapi.exception.UnauthorizedToolException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(PromptInjectionException.class)
  ResponseEntity<Map<String, String>> promptInjection(PromptInjectionException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("error", "prompt_injection", "message", ex.getMessage()));
  }

  @ExceptionHandler(UnauthorizedToolException.class)
  ResponseEntity<Map<String, String>> unauthorizedTool(UnauthorizedToolException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(Map.of("error", "unauthorized_tool", "message", ex.getMessage()));
  }

  @ExceptionHandler(StructuredOutputValidationException.class)
  ResponseEntity<Map<String, String>> invalidOutput(StructuredOutputValidationException ex) {
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(Map.of("error", "invalid_investigation", "message", ex.getMessage()));
  }

  @ExceptionHandler(ApprovalRequiredException.class)
  ResponseEntity<Map<String, Object>> approvalRequired(ApprovalRequiredException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            Map.of(
                "error",
                "approval_required",
                "message",
                ex.getMessage(),
                "approval",
                ex.pendingApproval()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("error", "bad_request", "message", ex.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<Map<String, String>> unexpected(Exception ex) {
    log.error("Unhandled investigation error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("error", "internal_error", "message", "Investigation failed"));
  }
}
