package com.vibhu.security.jwt.security;

/**
 * Resolves HMAC bytes for JWT signing/verification. Local/ECS: environment variable. Optional: AWS
 * Secrets Manager at startup.
 */
public interface JwtSecretProvider {

  byte[] currentHmacSecret();

  /** Null when no previous key is configured (no rotation in progress). */
  byte[] previousHmacSecret();
}
