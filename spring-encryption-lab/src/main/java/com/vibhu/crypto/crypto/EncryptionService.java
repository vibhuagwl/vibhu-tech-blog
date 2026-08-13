package com.vibhu.crypto.crypto;

public interface EncryptionService {
  /** Encrypt UTF-8 plaintext → versioned AES-GCM package. */
  String encrypt(String plaintext);

  /** Decrypt a package produced by {@link #encrypt(String)}. */
  String decrypt(String ciphertext);

  /** Re-encrypt under the active key (rotation helper). */
  String reencrypt(String ciphertext);
}
