package com.vibhu.crypto.crypto;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Interview demos: Encoding ≠ Encryption ≠ Hashing.
 *
 * <pre>
 * Encoding  → reversible without a secret (Base64)
 * Encryption → confidentiality with a key (AES-GCM)
 * Hashing   → one-way (SHA-256 / Argon2 for passwords)
 * </pre>
 */
public final class EncodingVsEncryptionDemo {
  private EncodingVsEncryptionDemo() {}

  public static String base64Encode(String text) {
    return Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8));
  }

  public static String base64Decode(String encoded) {
    return new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
  }

  public static byte[] sha256(String text) {
    try {
      return java.security.MessageDigest.getInstance("SHA-256")
          .digest(text.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
