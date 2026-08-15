package com.vibhu.counter.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.counter.common.dto.CounterAction;
import com.vibhu.counter.common.dto.CounterValueResponse;
import com.vibhu.counter.common.dto.IncrementCounterRequest;
import com.vibhu.counter.common.dto.IncrementCounterResponse;
import com.vibhu.counter.common.dto.ShardBreakdownResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CounterApiFlowTest {
  @Autowired private TestRestTemplate restTemplate;

  @Test
  void likesAreIdempotentAndShardsAreReadable() {
    HttpHeaders aliceHeaders = jsonHeaders();
    aliceHeaders.set("X-User-Id", "alice");
    aliceHeaders.set("Idempotency-Key", "alice-like-post-1");

    ResponseEntity<IncrementCounterResponse> aliceLike =
        restTemplate.exchange(
            "/api/v1/counters/{resourceId}/increment",
            HttpMethod.POST,
            new HttpEntity<>(
                new IncrementCounterRequest(1L, "alice-like-post-1", CounterAction.LIKE),
                aliceHeaders),
            IncrementCounterResponse.class,
            "post-1");

    assertThat(aliceLike.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(aliceLike.getBody()).isNotNull();
    assertThat(aliceLike.getBody().value()).isEqualTo(1);
    assertThat(aliceLike.getBody().applied()).isTrue();

    ResponseEntity<IncrementCounterResponse> aliceRetry =
        restTemplate.exchange(
            "/api/v1/counters/{resourceId}/increment",
            HttpMethod.POST,
            new HttpEntity<>(
                new IncrementCounterRequest(1L, "alice-like-post-1", CounterAction.LIKE),
                aliceHeaders),
            IncrementCounterResponse.class,
            "post-1");

    assertThat(aliceRetry.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(aliceRetry.getBody()).isNotNull();
    assertThat(aliceRetry.getBody().value()).isEqualTo(1);
    assertThat(aliceRetry.getBody().applied()).isFalse();

    HttpHeaders bobHeaders = jsonHeaders();
    bobHeaders.set("X-User-Id", "bob");
    bobHeaders.set("Idempotency-Key", "bob-like-post-1");
    ResponseEntity<IncrementCounterResponse> bobLike =
        restTemplate.exchange(
            "/api/v1/counters/{resourceId}/increment",
            HttpMethod.POST,
            new HttpEntity<>(
                new IncrementCounterRequest(1L, "bob-like-post-1", CounterAction.LIKE), bobHeaders),
            IncrementCounterResponse.class,
            "post-1");

    assertThat(bobLike.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(bobLike.getBody()).isNotNull();
    assertThat(bobLike.getBody().value()).isEqualTo(2);

    ResponseEntity<CounterValueResponse> value =
        restTemplate.getForEntity(
            "/api/v1/counters/{resourceId}", CounterValueResponse.class, "post-1");
    assertThat(value.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(value.getBody()).isNotNull();
    assertThat(value.getBody().value()).isEqualTo(2);
    assertThat(value.getBody().consistency()).isEqualTo("SHARD_SUM");

    ResponseEntity<ShardBreakdownResponse> shards =
        restTemplate.getForEntity(
            "/api/v1/counters/{resourceId}/shards", ShardBreakdownResponse.class, "post-1");
    assertThat(shards.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(shards.getBody()).isNotNull();
    assertThat(shards.getBody().shards()).isNotEmpty();
    assertThat(shards.getBody().shards())
        .anySatisfy(shard -> assertThat(shard.value()).isGreaterThan(0));
  }

  private static HttpHeaders jsonHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    return headers;
  }
}
