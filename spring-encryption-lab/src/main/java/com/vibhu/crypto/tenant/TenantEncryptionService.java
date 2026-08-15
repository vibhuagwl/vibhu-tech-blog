package com.vibhu.crypto.tenant;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.exception.CryptoException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Service;

/**
 * Multi-tenant encryption: Tenant A → Key A. Isolation is a key-hierarchy + ACL problem, not just
 * "different ciphertext".
 */
@Service
public class TenantEncryptionService {

  private static final int GCM_IV_LENGTH = 12;
  private static final int GCM_TAG_BITS = 128;

  private final Map<String, SecretKey> tenantKeys = new ConcurrentHashMap<>();
  private final SecureRandom secureRandom = new SecureRandom();

  public TenantEncryptionService() {
    tenantKeys.put("tenant-a", generateKey());
    tenantKeys.put("tenant-b", generateKey());
    tenantKeys.put("tenant-c", generateKey());
  }

  public String encrypt(String tenantId, String plaintext) {
    SecretKey key = requireTenant(tenantId);
    byte[] iv = new byte[GCM_IV_LENGTH];
    secureRandom.nextBytes(iv);
    try {
      Cipher cipher = Cipher.getInstance(AesEncryptionService.TRANSFORM);
      cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
      byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
      return tenantId
          + "|"
          + Base64.getUrlEncoder().withoutPadding().encodeToString(iv)
          + "|"
          + Base64.getUrlEncoder().withoutPadding().encodeToString(ct);
    } catch (Exception e) {
      throw new CryptoException("Tenant encrypt failed", e);
    }
  }

  public String decrypt(String tenantId, String packageWire) {
    String[] parts = packageWire.split("\\|", 3);
    if (parts.length != 3 || !parts[0].equals(tenantId)) {
      throw new CryptoException("Tenant key mismatch or invalid package");
    }
    SecretKey key = requireTenant(tenantId);
    byte[] iv = Base64.getUrlDecoder().decode(parts[1]);
    byte[] ct = Base64.getUrlDecoder().decode(parts[2]);
    try {
      Cipher cipher = Cipher.getInstance(AesEncryptionService.TRANSFORM);
      cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
      return new String(cipher.doFinal(ct), StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new CryptoException("Tenant decrypt failed", e);
    }
  }

  private SecretKey requireTenant(String tenantId) {
    SecretKey key = tenantKeys.get(tenantId);
    if (key == null) {
      throw new CryptoException("Unknown tenant: " + tenantId);
    }
    return key;
  }

  private static SecretKey generateKey() {
    try {
      KeyGenerator kg = KeyGenerator.getInstance("AES");
      kg.init(256);
      return kg.generateKey();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
