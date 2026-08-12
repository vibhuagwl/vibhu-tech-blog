package com.vibhu.security.idanywhere.idp.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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

/**
 * Local OIDC Authorization Server that mimics IDAnywhere/ADFS behavior for demos:
 * discovery, authorize, token, JWKS, plus AD-style claims (upn, groups, aud).
 *
 * Production: delete this module and point clients at real IDAnywhere issuer-uri.
 */
@Configuration
public class IdpSecurityConfig {

    @Value("${app.issuer}")
    private String issuer;

    @Value("${app.access-token-ttl:PT15M}")
    private Duration accessTokenTtl;

    @Bean
    @Order(1)
    SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration
                .OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
                .oidc(Customizer.withDefaults());
        http
                .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                        new LoginUrlAuthenticationEntryPoint("/login"),
                        new MediaTypeRequestMatcher(MediaType.TEXT_HTML)))
                .oauth2ResourceServer(rs -> rs.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .formLogin(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().issuer(issuer).build();
    }

    @Bean
    RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate,
                                                          PasswordEncoder passwordEncoder) {
        JdbcRegisteredClientRepository repository = new JdbcRegisteredClientRepository(jdbcTemplate);

        if (repository.findByClientId("payments-web") == null) {
            repository.save(RegisteredClient.withId(UUID.randomUUID().toString())
                    .clientId("payments-web")
                    .clientSecret(passwordEncoder.encode("payments-web-secret"))
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                    .redirectUri("http://127.0.0.1:8088/login/oauth2/code/idanywhere")
                    .redirectUri("http://localhost:8088/login/oauth2/code/idanywhere")
                    .scope(OidcScopes.OPENID)
                    .scope(OidcScopes.PROFILE)
                    .scope("api://payments-api/.default")
                    .clientSettings(ClientSettings.builder()
                            .requireAuthorizationConsent(true)
                            .requireProofKey(false)
                            .build())
                    .tokenSettings(TokenSettings.builder()
                            .accessTokenTimeToLive(accessTokenTtl)
                            .reuseRefreshTokens(false)
                            .build())
                    .build());
        }

        if (repository.findByClientId("payments-svc") == null) {
            repository.save(RegisteredClient.withId(UUID.randomUUID().toString())
                    .clientId("payments-svc")
                    .clientSecret(passwordEncoder.encode("payments-svc-secret"))
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                    .scope("api://payments-api/.default")
                    .tokenSettings(TokenSettings.builder()
                            .accessTokenTimeToLive(accessTokenTtl)
                            .build())
                    .build());
        }

        return repository;
    }

    @Bean
    OAuth2AuthorizationService authorizationService(JdbcTemplate jdbcTemplate,
                                                    RegisteredClientRepository clients) {
        return new JdbcOAuth2AuthorizationService(jdbcTemplate, clients);
    }

    @Bean
    OAuth2AuthorizationConsentService authorizationConsentService(JdbcTemplate jdbcTemplate,
                                                                  RegisteredClientRepository clients) {
        return new JdbcOAuth2AuthorizationConsentService(jdbcTemplate, clients);
    }

    /**
     * Emit ADFS/IDAnywhere-like claims so resource-api can map groups → Spring roles.
     */
    @Bean
    OAuth2TokenCustomizer<JwtEncodingContext> adfsStyleClaims() {
        return context -> {
            if (context.getTokenType() == null
                    || !"access_token".equals(context.getTokenType().getValue())) {
                return;
            }
            // ADFS-style resource audience
            context.getClaims().audience(List.of("api://payments-api"));

            Authentication principal = context.getPrincipal();
            if (principal == null) {
                return;
            }
            String username = principal.getName();
            context.getClaims().claim("upn", username + "@corp.example");
            context.getClaims().claim("unique_name", username);
            context.getClaims().claim("preferred_username", username);

            List<String> groups = new ArrayList<>();
            List<String> authorities = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
            if (authorities.contains("ROLE_USER") || authorities.contains("ROLE_ADMIN")) {
                groups.add("App.Payments.Users");
            }
            if (authorities.contains("ROLE_ADMIN")) {
                groups.add("App.Payments.Admins");
            }
            // client_credentials: no user — grant service group via client id
            if (groups.isEmpty() && "payments-svc".equals(context.getRegisteredClient().getClientId())) {
                groups.add("App.Payments.Users");
            }
            if (!groups.isEmpty()) {
                context.getClaims().claim("groups", groups);
            }
        };
    }
}
