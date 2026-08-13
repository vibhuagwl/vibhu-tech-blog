package com.vibhu.security.jwt.security;

import com.vibhu.security.jwt.config.JwtProperties;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String CLAIM_ROLES = "roles";

    private final JwtProperties.Jwt props;
    private final SecretKey currentKey;
    private final SecretKey previousKey;

    public JwtService(JwtProperties properties, JwtSecretProvider secretProvider) {
        this.props = properties.getJwt();
        this.currentKey = Keys.hmacShaKeyFor(secretProvider.currentHmacSecret());
        byte[] previous = secretProvider.previousHmacSecret();
        this.previousKey = previous == null ? null : Keys.hmacShaKeyFor(previous);
    }

    public String generateAccessToken(String subject, Collection<String> roles) {
        Instant now = Instant.now();
        return generateAccessToken(subject, roles, now, now.plus(props.getAccessTokenExpiration()),
                props.getIssuer(), props.getAudience(), currentKey);
    }

    String generateAccessToken(
            String subject,
            Collection<String> roles,
            Instant issuedAt,
            Instant expiresAt,
            String issuer,
            String audience,
            SecretKey key) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .claim(CLAIM_ROLES, List.copyOf(roles))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return parse(token).getPayload();
        } catch (ExpiredJwtException ex) {
            throw new InvalidTokenException("Access token expired", ex);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException("Invalid access token", ex);
        }
    }

    public String extractUsername(String token) {
        String subject = validateToken(token).getSubject();
        if (subject == null || subject.isBlank()) {
            throw new InvalidTokenException("Token subject is missing");
        }
        return subject;
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Object raw = validateToken(token).get(CLAIM_ROLES);
        if (raw instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public boolean isTokenExpired(String token) {
        try {
            Date exp = parse(token).getPayload().getExpiration();
            return exp == null || exp.toInstant().isBefore(Instant.now());
        } catch (ExpiredJwtException ex) {
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException("Invalid access token", ex);
        }
    }

    public String extractJti(String token) {
        String jti = validateToken(token).getId();
        return jti == null ? "" : jti;
    }

    public long accessTokenExpiresInSeconds() {
        return props.getAccessTokenExpiration().toSeconds();
    }

    public Duration accessTokenTtl() {
        return props.getAccessTokenExpiration();
    }

    SecretKey currentKey() {
        return currentKey;
    }

    JwtProperties.Jwt properties() {
        return props;
    }

    private io.jsonwebtoken.Jws<Claims> parse(String token) {
        try {
            return parser(currentKey).parseSignedClaims(token);
        } catch (ExpiredJwtException ex) {
            throw ex;
        } catch (JwtException primary) {
            if (previousKey == null) {
                throw primary;
            }
            return parser(previousKey).parseSignedClaims(token);
        }
    }

    private io.jsonwebtoken.JwtParser parser(SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.getIssuer())
                .requireAudience(props.getAudience())
                .clockSkewSeconds(Math.max(0, props.getClockSkew().toSeconds()))
                .build();
    }
}
