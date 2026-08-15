package com.vibhu.msp.gateway;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Thin HTTP client for gateway aggregation demos and WireMock tests. */
public final class HttpDownstreamClient {

  private final HttpClient httpClient;
  private final Duration timeout;

  public HttpDownstreamClient(Duration timeout) {
    this(HttpClient.newBuilder().connectTimeout(timeout).build(), timeout);
  }

  public HttpDownstreamClient(HttpClient httpClient, Duration timeout) {
    this.httpClient = httpClient;
    this.timeout = timeout;
  }

  public String getString(String url) throws IOException, InterruptedException {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .timeout(timeout)
        .GET()
        .build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 500) {
      throw new IOException("Downstream error: HTTP " + response.statusCode());
    }
    return response.body();
  }
}
