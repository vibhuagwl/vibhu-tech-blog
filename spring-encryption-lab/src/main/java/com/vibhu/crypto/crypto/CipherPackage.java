package com.vibhu.crypto.crypto;

/** Versioned ciphertext envelope: keyId|iv|ciphertext (Base64url parts). */
public record CipherPackage(String keyId, String iv, String ciphertext) {
  public String serialize() {
    return keyId + "|" + iv + "|" + ciphertext;
  }

  public static CipherPackage parse(String packed) {
    if (packed == null || packed.isBlank()) {
      throw new IllegalArgumentException("ciphertext is blank");
    }
    String[] parts = packed.split("\\|", 3);
    if (parts.length != 3) {
      throw new IllegalArgumentException("expected keyId|iv|ciphertext");
    }
    return new CipherPackage(parts[0], parts[1], parts[2]);
  }
}
