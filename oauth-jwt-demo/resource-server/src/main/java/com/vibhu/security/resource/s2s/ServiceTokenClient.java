package com.vibhu.security.resource.s2s;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.stereotype.Component;

/** Caches client_credentials access tokens and serializes refresh to avoid stampedes. */
@Component
public class ServiceTokenClient {

  private final OAuth2AuthorizedClientManager authorizedClientManager;
  private final AtomicReference<CachedToken> cache = new AtomicReference<>();
  private final ReentrantLock refreshLock = new ReentrantLock();

  public ServiceTokenClient(OAuth2AuthorizedClientManager authorizedClientManager) {
    this.authorizedClientManager = authorizedClientManager;
  }

  public String getAccessToken() {
    CachedToken current = cache.get();
    if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(30))) {
      return current.value();
    }
    refreshLock.lock();
    try {
      current = cache.get();
      if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(30))) {
        return current.value();
      }
      OAuth2AuthorizeRequest request =
          OAuth2AuthorizeRequest.withClientRegistrationId("payment-service")
              .principal("payment-service")
              .build();
      OAuth2AuthorizedClient client = authorizedClientManager.authorize(request);
      if (client == null || client.getAccessToken() == null) {
        throw new IllegalStateException("Unable to obtain client_credentials token");
      }
      OAuth2AccessToken token = client.getAccessToken();
      cache.set(new CachedToken(token.getTokenValue(), token.getExpiresAt()));
      return token.getTokenValue();
    } finally {
      refreshLock.unlock();
    }
  }

  private record CachedToken(String value, Instant expiresAt) {}
}
