package com.vibhu.security.jwt.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.security.jwt.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws IOException {
    write(
        response,
        HttpServletResponse.SC_UNAUTHORIZED,
        "Unauthorized",
        "Authentication required",
        request);
  }

  public void write(
      HttpServletResponse response,
      int status,
      String error,
      String message,
      HttpServletRequest request)
      throws IOException {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    ApiError body =
        new ApiError(
            Instant.now(), status, error, message, request.getRequestURI(), MDC.get("requestId"));
    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
