package com.vibhu.msp.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OpenTelemetry-style trace propagation — reads W3C {@code traceparent} or generates IDs,
 * stores trace/span in SLF4J MDC for log correlation.
 */
public final class TraceContextFilter extends OncePerRequestFilter {

  public static final String MDC_TRACE_ID = "traceId";
  public static final String MDC_SPAN_ID = "spanId";
  public static final String HEADER_TRACEPARENT = "traceparent";

  private static final Pattern TRACEPARENT = Pattern.compile(
      "00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}");

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
    TraceContext ctx = parseOrGenerate(request.getHeader(HEADER_TRACEPARENT));
    MDC.put(MDC_TRACE_ID, ctx.traceId());
    MDC.put(MDC_SPAN_ID, ctx.spanId());
    response.setHeader(HEADER_TRACEPARENT, ctx.toTraceparent());
    try {
      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(MDC_TRACE_ID);
      MDC.remove(MDC_SPAN_ID);
    }
  }

  static TraceContext parseOrGenerate(String traceparent) {
  return Optional.ofNullable(traceparent)
        .map(TRACEPARENT::matcher)
        .filter(Matcher::matches)
        .map(m -> new TraceContext(m.group(1), m.group(2)))
        .orElseGet(TraceContext::generate);
  }

  public record TraceContext(String traceId, String spanId) {
    public static TraceContext generate() {
      return new TraceContext(hex(16), hex(8));
    }

    public String toTraceparent() {
      return "00-" + traceId + "-" + spanId + "-01";
    }

    private static String hex(int bytes) {
      byte[] raw = new byte[bytes];
      UUID.randomUUID().getMostSignificantBits();
      for (int i = 0; i < bytes; i++) {
        raw[i] = (byte) (UUID.randomUUID().getMostSignificantBits() >> (i * 8));
      }
      StringBuilder sb = new StringBuilder(bytes * 2);
      for (byte b : raw) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    }
  }
}
