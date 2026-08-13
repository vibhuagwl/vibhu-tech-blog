package com.vibhu.security.jwt.service;

import com.vibhu.security.jwt.config.JwtProperties;
import com.vibhu.security.jwt.entity.RefreshToken;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import com.vibhu.security.jwt.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties properties;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtProperties properties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.properties = properties;
    }

    public record IssuedRefreshToken(String rawToken, RefreshToken entity) {}

    @Transactional
    public IssuedRefreshToken issue(User user) {
        return persist(user, UUID.randomUUID().toString());
    }

    /**
     * Rotate: revoke the presented token, issue a new one in the same family.
     * Reuse of a revoked token revokes the entire family (theft detection).
     */
    @Transactional
    public IssuedRefreshToken rotate(String rawRefreshToken) {
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid"));

        Instant now = Instant.now();
        if (existing.isRevoked()) {
            refreshTokenRepository.revokeFamily(existing.getFamilyId(), now);
            log.warn("Refresh token reuse detected; family revoked userId={}", existing.getUser().getId());
            throw new InvalidTokenException("Refresh token reuse detected");
        }
        if (existing.isExpired(now)) {
            existing.setRevokedAt(now);
            throw new InvalidTokenException("Refresh token expired");
        }

        IssuedRefreshToken next = persist(existing.getUser(), existing.getFamilyId());
        existing.setRevokedAt(now);
        existing.setReplacedById(next.entity().getId());
        refreshTokenRepository.save(existing);
        return next;
    }

    @Transactional
    public void revoke(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(hash(rawRefreshToken)).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            }
        });
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllForUser(user, Instant.now());
    }

    @Transactional(readOnly = true)
    public RefreshToken requireActive(String rawRefreshToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid"));
        if (token.isRevoked() || token.isExpired(Instant.now())) {
            throw new InvalidTokenException("Refresh token is invalid");
        }
        return token;
    }

    private IssuedRefreshToken persist(User user, String familyId) {
        String raw = randomToken();
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(raw));
        entity.setFamilyId(familyId);
        entity.setExpiresAt(Instant.now().plus(properties.getJwt().getRefreshTokenExpiration()));
        entity.setCreatedAt(Instant.now());
        return new IssuedRefreshToken(raw, refreshTokenRepository.save(entity));
    }

    static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
