package com.vibhu.security.authserver.config;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;

@Configuration
public class AuthorizationServerConfig {

  @Value("${app.issuer}")
  private String issuer;

  @Value("${app.access-token-ttl:PT10M}")
  private Duration accessTokenTtl;

  @Value("${app.refresh-token-ttl:P1D}")
  private Duration refreshTokenTtl;

  @Bean
  @Order(1)
  SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
    org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration
        .OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
    http.getConfigurer(OAuth2AuthorizationServerConfigurer.class).oidc(Customizer.withDefaults());
    http.exceptionHandling(
            exceptions ->
                exceptions.defaultAuthenticationEntryPointFor(
                    new LoginUrlAuthenticationEntryPoint("/login"),
                    new MediaTypeRequestMatcher(MediaType.TEXT_HTML)))
        .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()));
    return http.build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers("/actuator/health", "/h2-console/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .formLogin(Customizer.withDefaults())
        .csrf(csrf -> csrf.ignoringRequestMatchers("/h2-console/**"))
        .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
    return http.build();
  }

  @Bean
  AuthorizationServerSettings authorizationServerSettings() {
    return AuthorizationServerSettings.builder().issuer(issuer).build();
  }

  @Bean
  RegisteredClientRepository registeredClientRepository(
      JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
    JdbcRegisteredClientRepository repository = new JdbcRegisteredClientRepository(jdbcTemplate);

    if (repository.findByClientId("web-client") == null) {
      RegisteredClient webClient =
          RegisteredClient.withId(UUID.randomUUID().toString())
              .clientId("web-client")
              .clientSecret(passwordEncoder.encode("web-secret"))
              .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
              .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
              .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
              .redirectUri("http://127.0.0.1:8082/login/oauth2/code/web-client")
              .redirectUri("http://localhost:8082/login/oauth2/code/web-client")
              .postLogoutRedirectUri("http://127.0.0.1:8082/")
              .scope(OidcScopes.OPENID)
              .scope(OidcScopes.PROFILE)
              .scope("payment.read")
              .scope("payment.write")
              .scope("account.read")
              .scope("report.read")
              .clientSettings(
                  ClientSettings.builder()
                      .requireAuthorizationConsent(true)
                      .requireProofKey(false)
                      .build())
              .tokenSettings(defaultTokenSettings())
              .build();
      repository.save(webClient);
    }

    if (repository.findByClientId("spa-client") == null) {
      RegisteredClient spaClient =
          RegisteredClient.withId(UUID.randomUUID().toString())
              .clientId("spa-client")
              .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
              .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
              .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
              .redirectUri("http://127.0.0.1:3000/callback")
              .scope(OidcScopes.OPENID)
              .scope("payment.read")
              .clientSettings(
                  ClientSettings.builder()
                      .requireAuthorizationConsent(true)
                      .requireProofKey(true) // PKCE required for public client
                      .build())
              .tokenSettings(defaultTokenSettings())
              .build();
      repository.save(spaClient);
    }

    if (repository.findByClientId("payment-service") == null) {
      RegisteredClient paymentService =
          RegisteredClient.withId(UUID.randomUUID().toString())
              .clientId("payment-service")
              .clientSecret(passwordEncoder.encode("payment-secret"))
              .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
              .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
              .scope("account.read")
              .scope("payment.write")
              .tokenSettings(TokenSettings.builder().accessTokenTimeToLive(accessTokenTtl).build())
              .build();
      repository.save(paymentService);
    }

    return repository;
  }

  private TokenSettings defaultTokenSettings() {
    return TokenSettings.builder()
        .accessTokenTimeToLive(accessTokenTtl)
        .refreshTokenTimeToLive(refreshTokenTtl)
        .reuseRefreshTokens(false) // rotation-friendly
        .build();
  }

  @Bean
  OAuth2AuthorizationService authorizationService(
      JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {
    return new JdbcOAuth2AuthorizationService(jdbcTemplate, registeredClientRepository);
  }

  @Bean
  OAuth2AuthorizationConsentService authorizationConsentService(
      JdbcTemplate jdbcTemplate, RegisteredClientRepository registeredClientRepository) {
    return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, registeredClientRepository);
  }

  /**
   * Adds audience + roles claims to access tokens. Resource servers must still validate signature,
   * issuer, exp, and scopes — never trust claims blindly.
   */
  @Bean
  OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
    return context -> {
      if (context.getTokenType() == null
          || !"access_token".equals(context.getTokenType().getValue())) {
        return;
      }
      context.getClaims().audience(java.util.List.of("payment-api", "account-api", "report-api"));
      Authentication principal = context.getPrincipal();
      if (principal != null) {
        Set<String> roles =
            principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .collect(Collectors.toSet());
        if (!roles.isEmpty()) {
          context.getClaims().claim("roles", roles);
        }
      }
    };
  }
}
