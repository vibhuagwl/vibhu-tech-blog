package com.vibhu.crypto.crypto;

import com.vibhu.crypto.exception.CryptoException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Service;

/**
 * AES-256-GCM (recommended for new app-level encryption).
 *
 * <p>IV/nonce is 12 random bytes per encrypt — never reuse with the same key. Auth tag (128-bit) is
 * appended by Cipher; tampering fails decrypt.
 */
@Service
public class AesEncryptionService implements EncryptionService {
  public static final String TRANSFORM = "AES/GCM/NoPadding";
  private static final int IV_LEN = 12;
  private static final int TAG_BITS = 128;

  private final AesKeyProvider keyProvider;
  private final SecureRandom random = new SecureRandom();

  public AesEncryptionService(AesKeyProvider keyProvider) {
    this.keyProvider = keyProvider;
  }

  @Override
  public String encrypt(String plaintext) {
    if (plaintext == null) {
      throw new CryptoException("plaintext must not be null");
    }
    String keyId = keyProvider.activeKeyId();
    SecretKey key = keyProvider.requireKey(keyId);
    byte[] iv = new byte[IV_LEN];
    random.nextBytes(iv);
    try {
      Cipher cipher = Cipher.getInstance(TRANSFORM);
      cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
      return new CipherPackage(keyId, b64(iv), b64(ct)).serialize();
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("encrypt failed", ex);
    }
  }

  @Override
  public String decrypt(String packed) {
    CipherPackage pkg = CipherPackage.parse(packed);
    SecretKey key = keyProvider.requireKey(pkg.keyId());
    try {
      Cipher cipher = Cipher.getInstance(TRANSFORM);
      cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, unb64(pkg.iv())));
      byte[] pt = cipher.doFinal(unb64(pkg.ciphertext()));
      return new String(pt, StandardCharsets.UTF_8);
    } catch (GeneralSecurityException | IllegalArgumentException ex) {
      // Auth tag mismatch, wrong key, truncated payload — do not leak details.
      throw new CryptoException("decrypt failed", ex);
    }
  }

  @Override
  public String reencrypt(String ciphertext) {
    return encrypt(decrypt(ciphertext));
  }

  /** Low-level encrypt for binary DEKs / hybrid payloads. */
  public byte[] encryptBytes(SecretKey key, byte[] plaintext) {
    byte[] iv = new byte[IV_LEN];
    random.nextBytes(iv);
    try {
      Cipher cipher = Cipher.getInstance(TRANSFORM);
      cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      byte[] ct = cipher.doFinal(plaintext);
      return ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array();
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("encryptBytes failed", ex);
    }
  }

  public byte[] decryptBytes(SecretKey key, byte[] ivAndCiphertext) {
    if (ivAndCiphertext == null || ivAndCiphertext.length <= IV_LEN) {
      throw new CryptoException("ciphertext too short");
    }
    byte[] iv = new byte[IV_LEN];
    System.arraycopy(ivAndCiphertext, 0, iv, 0, IV_LEN);
    byte[] ct = new byte[ivAndCiphertext.length - IV_LEN];
    System.arraycopy(ivAndCiphertext, IV_LEN, ct, 0, ct.length);
    try {
      Cipher cipher = Cipher.getInstance(TRANSFORM);
      cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
      return cipher.doFinal(ct);
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("decryptBytes failed", ex);
    }
  }

  private static String b64(byte[] raw) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
  }

  private static byte[] unb64(String s) {
    return Base64.getUrlDecoder().decode(s);
  }
}
