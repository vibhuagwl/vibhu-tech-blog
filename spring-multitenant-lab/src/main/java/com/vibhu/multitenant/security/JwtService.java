package com.vibhu.multitenant.security;

import com.vibhu.multitenant.config.MultiTenantProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final MultiTenantProperties properties;
  private final SecretKey key;

  public JwtService(MultiTenantProperties properties) {
    this.properties = properties;
    this.key = Keys.hmacShaKeyFor(properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
  }

  public String issue(UUID userId, String email, UUID tenantId, String tenantSlug, List<String> roles) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(properties.getJwt().getTtlMinutes() * 60);
    return Jwts.builder()
        .issuer(properties.getJwt().getIssuer())
        .subject(userId.toString())
        .claim("email", email)
        .claim("tenant_id", tenantId.toString())
        .claim("tenant_slug", tenantSlug)
        .claim("roles", roles)
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public JwtPrincipal parse(String token) {
    Claims claims =
        Jwts.parser().verifyWith(key).requireIssuer(properties.getJwt().getIssuer()).build().parseSignedClaims(token).getPayload();
    @SuppressWarnings("unchecked")
    List<String> roles = claims.get("roles", List.class);
    return new JwtPrincipal(
        UUID.fromString(claims.getSubject()),
        claims.get("email", String.class),
        UUID.fromString(claims.get("tenant_id", String.class)),
        claims.get("tenant_slug", String.class),
        roles == null ? List.of() : roles);
  }

  public record JwtPrincipal(
      UUID userId, String email, UUID tenantId, String tenantSlug, List<String> roles) {}
}
