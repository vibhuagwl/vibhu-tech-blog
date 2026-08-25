package com.vibhu.ratelimit;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple load generator hitting the lab TOKEN_BUCKET playground endpoint. Run after
 * {@code mvn spring-boot:run}.
 */
public final class LoadGenerator {

  private static final String BASE = "http://127.0.0.1:8098/api/lab/TOKEN_BUCKET";
  private static final String LAB_KEY = "load-gen";

  public static void main(String[] args) throws Exception {
    int total = args.length > 0 ? Integer.parseInt(args[0]) : 50;
    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    AtomicInteger allowed = new AtomicInteger();
    AtomicInteger rejected = new AtomicInteger();
  for (int i = 0; i < total; i++) {
      HttpRequest req =
          HttpRequest.newBuilder()
              .uri(URI.create(BASE + "?cost=1"))
              .header("X-Lab-Key", LAB_KEY)
              .GET()
              .timeout(Duration.ofSeconds(5))
              .build();
      HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
      if (resp.body().contains("\"allowed\":true")) {
        allowed.incrementAndGet();
      } else {
        rejected.incrementAndGet();
      }
    }
    System.out.printf(
        "LoadGenerator complete: total=%d allowed=%d rejected=%d%n",
        total, allowed.get(), rejected.get());
  }
}
