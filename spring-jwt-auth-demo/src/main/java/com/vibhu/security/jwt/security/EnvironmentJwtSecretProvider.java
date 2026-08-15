package com.vibhu.security.jwt.security;

import com.vibhu.security.jwt.config.JwtProperties;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Reads HMAC material from Spring config, which is bound from env JWT_SECRET.
 *
 * <pre>
 *   Environment / ECS task definition
 *           ↓
 *   AWS Secrets Manager  (mapped as env — preferred)
 *           ↓
 *   security.jwt.secret
 *           ↓
 *   JwtService
 * </pre>
 */
@Component
@ConditionalOnProperty(
    name = "security.jwt.secret-source",
    havingValue = "env",
    matchIfMissing = true)
public class EnvironmentJwtSecretProvider implements JwtSecretProvider {

  private final byte[] current;
  private final byte[] previous;

  public EnvironmentJwtSecretProvider(JwtProperties properties) {
    this.current = requireHmac(properties.getJwt().getSecret(), "JWT_SECRET / security.jwt.secret");
    String prev = properties.getJwt().getPreviousSecret();
    this.previous =
        (prev == null || prev.isBlank()) ? null : requireHmac(prev, "JWT_PREVIOUS_SECRET");
  }

  static byte[] requireHmac(String secret, String name) {
    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException(name + " is required and must not be empty");
    }
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException(name + " must be at least 32 bytes for HS256");
    }
    return bytes;
  }

  @Override
  public byte[] currentHmacSecret() {
    return current;
  }

  @Override
  public byte[] previousHmacSecret() {
    return previous;
  }
}
