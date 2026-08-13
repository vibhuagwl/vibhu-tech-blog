package com.vibhu.hadron.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.hadron.domain.CashLineEvent;
import com.vibhu.hadron.dto.BatchReplayRequest;
import com.vibhu.hadron.dto.DeadLetterResponse;
import com.vibhu.hadron.dto.PublishEventRequest;
import com.vibhu.hadron.entity.DeadLetterMessageEntity;
import com.vibhu.hadron.service.DeadLetterMessageService;
import com.vibhu.hadron.service.DlqReplayService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dlq")
public class DlqController {

  private final DeadLetterMessageService dlq;
  private final DlqReplayService replay;
  private final ObjectMapper mapper;

  public DlqController(DeadLetterMessageService dlq, DlqReplayService replay, ObjectMapper mapper) {
    this.dlq = dlq;
    this.replay = replay;
    this.mapper = mapper;
  }

  @GetMapping
  public List<DeadLetterResponse> list() {
    return dlq.list().stream().map(this::toResponse).toList();
  }

  @GetMapping("/{id}")
  public ResponseEntity<DeadLetterResponse> get(@PathVariable Long id) {
    return dlq.find(id).map(row -> ResponseEntity.ok(toResponse(row))).orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/{id}/replay")
  public DeadLetterResponse replayOne(
      @PathVariable Long id, @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor) {
    return toResponse(replay.replay(id, actor));
  }

  @PostMapping("/replay/{cashlineId}")
  public List<DeadLetterResponse> replayCashLine(
      @PathVariable String cashlineId,
      @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor) {
    return replay.replayCashLine(cashlineId, actor).stream().map(this::toResponse).toList();
  }

  @PostMapping("/replay/batch")
  public List<DeadLetterResponse> replayBatch(
      @Valid @RequestBody BatchReplayRequest request,
      @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor) {
    return replay.replayBatch(request.ids(), actor).stream().map(this::toResponse).toList();
  }

  @PostMapping("/{id}/correct")
  public DeadLetterResponse correct(
      @PathVariable Long id,
      @Valid @RequestBody PublishEventRequest request,
      @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor)
      throws Exception {
    String payload =
        mapper.writeValueAsString(
            new CashLineEvent(
                request.eventId(),
                request.cashLineId(),
                request.eventType(),
                request.sequenceNumber(),
                request.version(),
                request.participantId(),
                request.accountId(),
                request.currency(),
                request.amount(),
                request.transactionType(),
                request.occurredAt(),
                request.attributes()));
    return toResponse(dlq.replacePayload(id, payload, actor));
  }

  @PostMapping("/{id}/resolve")
  public DeadLetterResponse resolve(
      @PathVariable Long id, @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor) {
    return toResponse(dlq.resolve(id, actor));
  }

  @PostMapping("/{id}/ignore")
  public DeadLetterResponse ignore(
      @PathVariable Long id, @RequestHeader(name = "X-Replay-Actor", defaultValue = "lab-operator") String actor) {
    return toResponse(dlq.ignore(id, actor));
  }

  private DeadLetterResponse toResponse(DeadLetterMessageEntity row) {
    return new DeadLetterResponse(
        row.getId(),
        row.getEventId(),
        row.getCashLineId(),
        row.getEventType(),
        row.getTopic(),
        row.getPartitionNo(),
        row.getOffsetNo(),
        row.getFailureReason(),
        row.getExceptionType(),
        row.getExceptionMessage(),
        row.getRetryCount(),
        row.getStatus(),
        row.getReplayCount(),
        row.getReplayActor(),
        row.getFirstFailedAt(),
        row.getLastFailedAt(),
        row.getReplayedAt(),
        row.getResolvedAt(),
        row.getVersion());
  }
}
