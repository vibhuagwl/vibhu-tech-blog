package com.vibhu.hadron.web;

import com.vibhu.hadron.dto.NeptuneSeedRequest;
import com.vibhu.hadron.entity.NeptuneCashLineEntity;
import com.vibhu.hadron.entity.PollerCursorEntity;
import com.vibhu.hadron.service.NeptunePollerService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/neptune")
public class NeptuneController {

  private final NeptunePollerService poller;

  public NeptuneController(NeptunePollerService poller) {
    this.poller = poller;
  }

  @PostMapping("/seed")
  public NeptuneCashLineEntity seed(@Valid @RequestBody NeptuneSeedRequest request) {
    NeptuneCashLineEntity row = new NeptuneCashLineEntity();
    row.setCashLineId(request.cashLineId());
    row.setParticipantId(request.participantId());
    row.setAccountId(request.accountId());
    row.setCurrency(request.currency());
    row.setAmount(request.amount());
    row.setEventType(request.eventType());
    row.setSequenceNumber(request.sequenceNumber());
    row.setVersion(request.version() == 0 ? 1 : request.version());
    row.setDeleted(request.deleted());
    row.setUpdatedAt(request.updatedAt() == null ? Instant.now() : request.updatedAt());
    return poller.seed(row);
  }

  @PostMapping("/poll")
  public Map<String, Object> poll() {
    int published = poller.poll();
    PollerCursorEntity cursor = poller.cursor();
    return Map.of(
        "published", published,
        "cursorUpdatedAt", String.valueOf(cursor.getLastUpdatedAt()),
        "cursorId", cursor.getLastId());
  }

  @GetMapping("/cursor")
  public PollerCursorEntity cursor() {
    return poller.cursor();
  }
}
