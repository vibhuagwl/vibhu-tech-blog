package com.vibhu.crypto.kms;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.exception.CryptoException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * Local stand-in for AWS KMS envelope encryption.
 *
 * <pre>
 *   KMS (KEK) → GenerateDataKey → plain DEK + encrypted DEK
 *   Encrypt data with DEK, store encrypted DEK beside ciphertext, discard plain DEK
 * </pre>
 *
 * <p>In AWS: use GenerateDataKey / Decrypt via KMS SDK. Never persist the plaintext DEK.
 * Never repeatedly fetch a master key into the app for bulk crypto.
 */
@Service
public class EnvelopeEncryptionService {

  private static final int GCM_IV_LENGTH = 12;
  private static final int GCM_TAG_BITS = 128;

  /** Simulated KMS master keys (KEKs) — in prod these never leave KMS/HSM. */
  private final Map<String, SecretKey> kekStore = new ConcurrentHashMap<>();

  private final SecureRandom secureRandom = new SecureRandom();

  public EnvelopeEncryptionService() {
    kekStore.put("kek-v1", generateAesKey(256));
    kekStore.put("kek-v2", generateAesKey(256));
  }

  public EnvelopePackage encrypt(String kekId, byte[] plaintext) {
    SecretKey kek = requireKek(kekId);
    SecretKey dek = generateAesKey(256);
    byte[] encryptedDek = wrapKey(kek, dek.getEncoded());

    byte[] iv = new byte[GCM_IV_LENGTH];
    secureRandom.nextBytes(iv);
    byte[] ciphertext = aesGcm(Cipher.ENCRYPT_MODE, dek, iv, plaintext);

    return new EnvelopePackage(
        kekId,
        b64(encryptedDek),
        b64(iv),
        b64(ciphertext));
  }

  public byte[] decrypt(EnvelopePackage pkg) {
    SecretKey kek = requireKek(pkg.kekId());
    byte[] dekBytes = unwrapKey(kek, unb64(pkg.encryptedDek()));
    SecretKey dek = new SecretKeySpec(dekBytes, "AES");
    return aesGcm(
        Cipher.DECRYPT_MODE, dek, unb64(pkg.iv()), unb64(pkg.ciphertext()));
  }

  public String encryptToWireFormat(String kekId, String plaintext) {
    EnvelopePackage pkg = encrypt(kekId, plaintext.getBytes(StandardCharsets.UTF_8));
    return pkg.kekId() + "|" + pkg.encryptedDek() + "|" + pkg.iv() + "|" + pkg.ciphertext();
  }

  public String decryptFromWireFormat(String wire) {
    String[] parts = wire.split("\\|", 4);
    if (parts.length != 4) {
      throw new CryptoException("Invalid envelope wire format");
    }
    byte[] plain = decrypt(new EnvelopePackage(parts[0], parts[1], parts[2], parts[3]));
    return new String(plain, StandardCharsets.UTF_8);
  }

  private SecretKey requireKek(String kekId) {
    SecretKey kek = kekStore.get(kekId);
    if (kek == null) {
      throw new CryptoException("Unknown KEK id: " + kekId);
    }
    return kek;
  }

  private byte[] wrapKey(SecretKey kek, byte[] dek) {
    byte[] iv = new byte[GCM_IV_LENGTH];
    secureRandom.nextBytes(iv);
    byte[] wrapped = aesGcm(Cipher.ENCRYPT_MODE, kek, iv, dek);
    return ByteBuffer.allocate(iv.length + wrapped.length).put(iv).put(wrapped).array();
  }

  private byte[] unwrapKey(SecretKey kek, byte[] encryptedDek) {
    ByteBuffer buf = ByteBuffer.wrap(encryptedDek);
    byte[] iv = new byte[GCM_IV_LENGTH];
    buf.get(iv);
    byte[] wrapped = new byte[buf.remaining()];
    buf.get(wrapped);
    return aesGcm(Cipher.DECRYPT_MODE, kek, iv, wrapped);
  }

  private byte[] aesGcm(int mode, SecretKey key, byte[] iv, byte[] input) {
    try {
      Cipher cipher = Cipher.getInstance(AesEncryptionService.TRANSFORM);
      cipher.init(mode, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
      return cipher.doFinal(input);
    } catch (Exception e) {
      throw new CryptoException("Envelope AES-GCM failed", e);
    }
  }

  private static SecretKey generateAesKey(int bits) {
    try {
      KeyGenerator kg = KeyGenerator.getInstance("AES");
      kg.init(bits);
      return kg.generateKey();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private static String b64(byte[] raw) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
  }

  private static byte[] unb64(String s) {
    return Base64.getUrlDecoder().decode(s);
  }

  public record EnvelopePackage(String kekId, String encryptedDek, String iv, String ciphertext) {}
}
