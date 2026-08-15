package com.vibhu.msp.gateway;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.vibhu.msp.resilience.HedgedRequests;
import com.vibhu.msp.resilience.ManualCircuitBreaker;
import java.time.Duration;
import java.util.concurrent.CompletionException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AggregationResilienceWireMockTest {

  private WireMockServer wireMock;
  private HttpDownstreamClient client;
  private AggregationService aggregationService;

  @BeforeEach
  void setUp() {
    wireMock = new WireMockServer(wireMockConfig().dynamicPort());
    wireMock.start();
    WireMock.configureFor("localhost", wireMock.port());
    client = new HttpDownstreamClient(Duration.ofSeconds(2));
    aggregationService = new AggregationService();
  }

  @AfterEach
  void tearDown() {
    wireMock.stop();
  }

  @Test
  void aggregation_succeedsWhenAllDownstreamsHealthy() throws Exception {
    stubJson("/customer", "Alice");
    stubJson("/payment", "PAID");
    stubJson("/inventory", "5");

    String base = baseUrl();
    var dashboard =
        aggregationService
            .aggregateOrderView(
                "ORD-1",
                () -> fetch(base + "/customer"),
                () -> fetch(base + "/payment"),
                () -> Integer.parseInt(fetch(base + "/inventory")))
            .join();

    assertEquals("ORD-1", dashboard.orderId());
    assertEquals("Alice", dashboard.customerName());
    assertEquals("PAID", dashboard.paymentStatus());
    assertEquals(5, dashboard.inventoryReserved());
  }

  @Test
  void aggregation_failsWhenOneDownstreamReturns500() {
    stubJson("/customer", "Alice");
    wireMock.stubFor(get("/payment").willReturn(aResponse().withStatus(500)));
    stubJson("/inventory", "3");

    String base = baseUrl();
    assertThrows(
        CompletionException.class,
        () ->
            aggregationService
                .aggregateOrderView(
                    "ORD-2",
                    () -> fetch(base + "/customer"),
                    () -> fetch(base + "/payment"),
                    () -> Integer.parseInt(fetch(base + "/inventory")))
                .join());
  }

  @Test
  void circuitBreaker_opensAfterRepeatedDownstreamFailures() throws Exception {
    wireMock.stubFor(get("/fragile").willReturn(aResponse().withStatus(503)));
    ManualCircuitBreaker cb = new ManualCircuitBreaker(2, Duration.ofMinutes(1));
    String url = baseUrl() + "/fragile";
    AtomicInteger attempts = new AtomicInteger();

    assertThrows(
        Exception.class,
        () ->
            cb.execute(
                () -> {
                  attempts.incrementAndGet();
                  return client.getString(url);
                }));
    assertThrows(
        Exception.class,
        () ->
            cb.execute(
                () -> {
                  attempts.incrementAndGet();
                  return client.getString(url);
                }));
    assertEquals(ManualCircuitBreaker.State.OPEN, cb.state());
    assertThrows(
        ManualCircuitBreaker.CircuitOpenException.class,
        () -> cb.execute(() -> client.getString(url)));
    assertEquals(2, attempts.get());
  }

  @Test
  void hedgedRequest_returnsFastResponseWhenPrimaryIsSlow() throws Exception {
    wireMock.stubFor(get("/slow").willReturn(aResponse().withFixedDelay(800).withBody("slow")));
    wireMock.stubFor(get("/fast").willReturn(aResponse().withBody("fast")));

    String slowUrl = baseUrl() + "/slow";
    String fastUrl = baseUrl() + "/fast";
    HedgedRequests hedged = new HedgedRequests(Duration.ofMillis(100));

    String result =
        hedged.execute(
            () -> {
              try {
                return client.getString(slowUrl);
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            () -> {
              try {
                return client.getString(fastUrl);
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            });

    assertEquals("fast", result);
    wireMock.verify(getRequestedFor(urlEqualTo("/fast")));
  }

  @Test
  void hedgedRequest_usesPrimaryWhenFastEnough() throws Exception {
    stubJson("/primary", "primary-ok");
    String url = baseUrl() + "/primary";
    HedgedRequests hedged = new HedgedRequests(Duration.ofMillis(200));

    String result =
        hedged.execute(
            () -> {
              try {
                return client.getString(url);
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            () -> "hedge");

    assertEquals("primary-ok", result);
    wireMock.verify(1, getRequestedFor(urlEqualTo("/primary")));
  }

  private void stubJson(String path, String body) {
    wireMock.stubFor(
        get(path)
            .willReturn(
                aResponse()
                    .withStatus(200)
                    .withBody(body)
                    .withHeader("Content-Type", "application/json")));
  }

  private String baseUrl() {
    return "http://localhost:" + wireMock.port();
  }

  private String fetch(String url) {
    try {
      return client.getString(url);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
