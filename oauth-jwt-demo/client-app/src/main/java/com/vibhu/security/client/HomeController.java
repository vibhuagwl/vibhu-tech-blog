package com.vibhu.security.client;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.client.RestClient;

@Controller
public class HomeController {

  private final RestClient.Builder restClientBuilder;
  private final String resourceBaseUrl;

  public HomeController(
      RestClient.Builder restClientBuilder,
      @Value("${app.resource-base-url}") String resourceBaseUrl) {
    this.restClientBuilder = restClientBuilder;
    this.resourceBaseUrl = resourceBaseUrl;
  }

  @GetMapping("/")
  public String index() {
    return "index";
  }

  @GetMapping("/payments")
  public String payments(
      @RegisteredOAuth2AuthorizedClient("web-client") OAuth2AuthorizedClient client,
      @AuthenticationPrincipal OidcUser user,
      Model model) {
    String token = client.getAccessToken().getTokenValue();
    Object body =
        restClientBuilder
            .build()
            .get()
            .uri(resourceBaseUrl + "/api/payments")
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(Object.class);
    model.addAttribute("user", user != null ? user.getPreferredUsername() : "unknown");
    model.addAttribute("payments", body);
    model.addAttribute("scopes", client.getAccessToken().getScopes());
    return "payments";
  }

  @GetMapping("/me")
  public String me(@AuthenticationPrincipal OidcUser user, Model model) {
    model.addAttribute("claims", user != null ? user.getClaims() : Map.of());
    return "me";
  }
}
