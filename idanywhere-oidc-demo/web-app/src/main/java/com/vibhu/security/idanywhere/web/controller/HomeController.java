package com.vibhu.security.idanywhere.web.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
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

  private final RestClient restClient = RestClient.create();

  @Value("${app.resource-base-url}")
  private String resourceBaseUrl;

  @GetMapping("/")
  public String index() {
    return "index";
  }

  @GetMapping("/me")
  public String me(@AuthenticationPrincipal OidcUser user, Model model) {
    model.addAttribute("user", user);
    model.addAttribute("claims", user.getClaims());
    return "me";
  }

  @GetMapping("/payments")
  public String payments(
      @RegisteredOAuth2AuthorizedClient("idanywhere") OAuth2AuthorizedClient client,
      @AuthenticationPrincipal OidcUser user,
      Model model) {
    String token = client.getAccessToken().getTokenValue();
    Object body =
        restClient
            .get()
            .uri(resourceBaseUrl + "/api/payments")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .body(Object.class);
    model.addAttribute("username", user.getPreferredUsername());
    model.addAttribute("payments", body);
    return "payments";
  }

  @GetMapping("/token-debug")
  public String tokenDebug(
      @RegisteredOAuth2AuthorizedClient("idanywhere") OAuth2AuthorizedClient client, Model model) {
    model.addAttribute("tokenType", client.getAccessToken().getTokenType().getValue());
    model.addAttribute("scopes", client.getAccessToken().getScopes());
    model.addAttribute("expiresAt", client.getAccessToken().getExpiresAt());
    model.addAttribute("accessTokenPreview", preview(client.getAccessToken().getTokenValue()));
    return "token-debug";
  }

  private static String preview(String jwt) {
    if (jwt == null || jwt.length() < 24) {
      return Map.of("len", jwt == null ? 0 : jwt.length()).toString();
    }
    return jwt.substring(0, 16) + "…" + jwt.substring(jwt.length() - 8);
  }
}
