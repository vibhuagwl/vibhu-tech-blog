package com.vibhu.security.pii.crypto;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * AES-256-GCM envelope for column-level PII. Key material comes from SecretProvider (env/KMS).
 */
public final class AesGcmCipher {

    private static final String ALGO = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKey key;
    private final SecureRandom random = new SecureRandom();

    public AesGcmCipher(byte[] rawKey) {
        if (rawKey.length != 32) {
            throw new IllegalArgumentException("PII key must be 32 bytes (AES-256)");
        }
        this.key = new SecretKeySpec(rawKey, "AES");
    }

    public static AesGcmCipher fromBase64Key(String base64Key) {
        byte[] decoded = Base64.getDecoder().decode(base64Key);
        return new AesGcmCipher(decoded);
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(ALGO);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] packed = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, packed, 0, iv.length);
            System.arraycopy(cipherText, 0, packed, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(packed);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PII encryption failed", e);
        }
    }

    public String decrypt(String packedBase64) {
        if (packedBase64 == null) {
            return null;
        }
        try {
            byte[] packed = Base64.getDecoder().decode(packedBase64);
            byte[] iv = new byte[IV_BYTES];
            byte[] cipherText = new byte[packed.length - IV_BYTES];
            System.arraycopy(packed, 0, iv, 0, IV_BYTES);
            System.arraycopy(packed, IV_BYTES, cipherText, 0, cipherText.length);
            Cipher cipher = Cipher.getInstance(ALGO);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] plain = cipher.doFinal(cipherText);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PII decryption failed", e);
        }
    }
}
