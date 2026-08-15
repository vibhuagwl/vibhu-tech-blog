package com.vibhu.counter.api.controller;

import com.vibhu.counter.api.service.CounterService;
import com.vibhu.counter.common.dto.BatchCounterRequest;
import com.vibhu.counter.common.dto.BatchCounterResponse;
import com.vibhu.counter.common.dto.CounterValueResponse;
import com.vibhu.counter.common.dto.FlushResponse;
import com.vibhu.counter.common.dto.IncrementCounterRequest;
import com.vibhu.counter.common.dto.IncrementCounterResponse;
import com.vibhu.counter.common.dto.ShardBreakdownResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/counters")
public class CounterController {
  private final CounterService counterService;

  public CounterController(CounterService counterService) {
    this.counterService = counterService;
  }

  @PostMapping("/{resourceId}/increment")
  public IncrementCounterResponse increment(
      @PathVariable String resourceId,
      @RequestHeader(name = "X-User-Id", required = false) String userId,
      @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
      @RequestBody IncrementCounterRequest request) {
    return counterService.increment(resourceId, request, userId, idempotencyKey);
  }

  @GetMapping("/{resourceId}")
  public CounterValueResponse get(@PathVariable String resourceId) {
    return counterService.get(resourceId);
  }

  @PostMapping("/batch")
  public BatchCounterResponse batch(@RequestBody BatchCounterRequest request) {
    return counterService.getBatch(request.resourceIds());
  }

  @GetMapping("/{resourceId}/shards")
  public ShardBreakdownResponse shards(@PathVariable String resourceId) {
    return counterService.shards(resourceId);
  }

  @PostMapping("/{resourceId}/flush")
  public FlushResponse flush(@PathVariable String resourceId) {
    return counterService.flush(resourceId);
  }
}
