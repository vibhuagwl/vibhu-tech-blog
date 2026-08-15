package com.vibhu.msp.observability;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class TraceContextFilterTest {

  @Test
  void parsesW3cTraceparent() {
    String header = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    TraceContextFilter.TraceContext ctx = TraceContextFilter.parseOrGenerate(header);
    assertEquals("4bf92f3577b34da6a3ce929d0e0e4736", ctx.traceId());
    assertEquals("00f067aa0ba902b7", ctx.spanId());
    assertEquals(header, ctx.toTraceparent());
  }

  @Test
  void generatesTraceContextWhenHeaderMissing() {
    TraceContextFilter.TraceContext ctx = TraceContextFilter.parseOrGenerate(null);
    assertEquals(32, ctx.traceId().length());
    assertEquals(16, ctx.spanId().length());
    assertNotEquals(ctx.traceId(), ctx.spanId());
  }
}
