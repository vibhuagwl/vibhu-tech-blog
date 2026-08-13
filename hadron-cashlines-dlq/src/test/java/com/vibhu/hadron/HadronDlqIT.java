package com.vibhu.hadron;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.repository.CashLineRepository;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import com.vibhu.hadron.repository.ProcessedEventRepository;
import com.vibhu.hadron.repository.WaitingEventRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class HadronDlqIT {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired CashLineRepository cashLines;
  @Autowired ProcessedEventRepository processed;
  @Autowired DeadLetterMessageRepository dlq;
  @Autowired WaitingEventRepository waiting;

  @Test
  void successfulProcessingIsIdempotent() throws Exception {
    mvc.perform(post("/api/lab/scenario/success")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> cashLines.findById("CL-OK").isPresent());
    mvc.perform(post("/api/lab/scenario/duplicate")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> processed.existsById("e-dup-1"));
    assertThat(processed.existsById("e-dup-1")).isTrue();
    assertThat(cashLines.findById("CL-DUP")).isPresent();
  }

  @Test
  void poisonMessageGoesToDlqWithoutInfiniteRetry() throws Exception {
    mvc.perform(post("/api/lab/scenario/poison")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> dlq.count() >= 1);
    assertThat(dlq.findAll().stream().anyMatch(row -> "CL-POISON".equals(row.getCashLineId()))).isTrue();
  }

  @Test
  void invalidAmountIsPermanentAndReplaysAfterCorrection() throws Exception {
    mvc.perform(post("/api/lab/scenario/invalid-amount")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> dlq.findByEventId("e-amt-1").isPresent());
    Long id = dlq.findByEventId("e-amt-1").orElseThrow().getId();
    String corrected =
        """
        {"eventId":"e-amt-1","cashLineId":"CL-AMT","eventType":"CASHLINE_CREATED","sequenceNumber":1,"version":1,
         "participantId":"P-NEPTUNE","accountId":"ACC-1001","currency":"USD","amount":25.00,"transactionType":"DRAWDOWN"}
        """;
    mvc.perform(
            post("/api/dlq/" + id + "/correct")
                .header("X-Replay-Actor", "ops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corrected))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("READY_FOR_REPLAY"));
    mvc.perform(post("/api/dlq/" + id + "/replay").header("X-Replay-Actor", "ops"))
        .andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> cashLines.findById("CL-AMT").isPresent());
    assertThat(cashLines.findById("CL-AMT").orElseThrow().getAmount()).isEqualByComparingTo(new BigDecimal("25.00"));
    await().atMost(Duration.ofSeconds(3)).until(() -> dlq.findByEventId("e-amt-1").orElseThrow().getStatus() == DlqStatus.REPLAYED);
  }

  @Test
  void transientFailureRetriesThenSucceeds() throws Exception {
    mvc.perform(post("/api/lab/scenario/transient-then-ok")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(5)).until(() -> cashLines.findById("CL-TMP").isPresent());
    assertThat(processed.existsById("e-tmp-1")).isTrue();
  }

  @Test
  void outOfOrderEventIsParked() throws Exception {
    mvc.perform(post("/api/lab/scenario/out-of-order")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> cashLines.findById("CL-ORD").isPresent());
    await().atMost(Duration.ofSeconds(3)).until(() -> !waiting.findByCashLineIdOrderBySequenceNumberAsc("CL-ORD").isEmpty());
    assertThat(waiting.findByEventId("e-ord-3")).isPresent();
  }

  @Test
  void concurrentReplayIsRejectedForLoser() throws Exception {
    mvc.perform(post("/api/lab/scenario/invalid-business")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(3)).until(() -> dlq.findByEventId("e-bad-1").isPresent());
    Long id = dlq.findByEventId("e-bad-1").orElseThrow().getId();
    ExecutorService pool = Executors.newFixedThreadPool(2);
    AtomicInteger conflicts = new AtomicInteger();
    AtomicInteger ok = new AtomicInteger();
    Callable<Integer> task =
        () -> {
          MvcResult result =
              mvc.perform(post("/api/dlq/" + id + "/replay").header("X-Replay-Actor", "ops")).andReturn();
          if (result.getResponse().getStatus() == 409) {
            conflicts.incrementAndGet();
          } else if (result.getResponse().getStatus() == 200) {
            ok.incrementAndGet();
          }
          return result.getResponse().getStatus();
        };
    Future<Integer> a = pool.submit(task);
    Future<Integer> b = pool.submit(task);
    a.get();
    b.get();
    pool.shutdownNow();
    assertThat(ok.get()).isEqualTo(1);
    assertThat(conflicts.get()).isEqualTo(1);
  }

  @Test
  void neptunePollerUsesCompositeCursor() throws Exception {
    Instant same = Instant.parse("2026-01-01T00:00:00Z");
    seedNeptune("CL-N1", 1, same);
    seedNeptune("CL-N2", 1, same);
    mvc.perform(post("/api/neptune/poll"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.published").value(2));
    await().atMost(Duration.ofSeconds(3)).until(() -> cashLines.findById("CL-N1").isPresent());
    await().atMost(Duration.ofSeconds(3)).until(() -> cashLines.findById("CL-N2").isPresent());
  }

  @Test
  void timeoutEventuallyLandsInDlq() throws Exception {
    mvc.perform(post("/api/lab/scenario/timeout")).andExpect(status().isOk());
    await().atMost(Duration.ofSeconds(6)).until(() -> dlq.findByEventId("e-to-1").isPresent());
    assertThat(dlq.findByEventId("e-to-1").orElseThrow().getRetryCount()).isGreaterThanOrEqualTo(3);
  }

  private void seedNeptune(String cashLineId, int sequence, Instant updatedAt) throws Exception {
    String body =
        mapper.createObjectNode()
            .put("cashLineId", cashLineId)
            .put("participantId", "P-NEPTUNE")
            .put("accountId", "ACC-1001")
            .put("currency", "USD")
            .put("amount", 10)
            .put("eventType", "CASHLINE_CREATED")
            .put("sequenceNumber", sequence)
            .put("version", 1)
            .put("deleted", false)
            .put("updatedAt", updatedAt.toString())
            .toString();
    mvc.perform(post("/api/neptune/seed").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isOk());
  }
}
