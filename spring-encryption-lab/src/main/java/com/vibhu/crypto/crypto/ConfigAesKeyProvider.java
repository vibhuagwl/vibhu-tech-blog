package com.vibhu.crypto.crypto;

import com.vibhu.crypto.config.CryptoProperties;
import com.vibhu.crypto.exception.CryptoException;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * Loads AES-256 keys from config/env (Base64). Never log key material.
 *
 * <pre>
 *   Secrets Manager / KMS  →  env CRYPTO_KEY_V2  →  crypto.keys.v2  →  this bean
 * </pre>
 */
@Component
public class ConfigAesKeyProvider implements AesKeyProvider {
  private final String activeKeyId;
  private final Map<String, SecretKey> keys = new ConcurrentHashMap<>();

  public ConfigAesKeyProvider(CryptoProperties properties) {
    this.activeKeyId = properties.getActiveKeyId();
    if (properties.getKeys() == null || properties.getKeys().isEmpty()) {
      throw new CryptoException("crypto.keys must contain at least one AES-256 key");
    }
    for (Map.Entry<String, String> e : properties.getKeys().entrySet()) {
      keys.put(e.getKey(), decodeAes256(e.getKey(), e.getValue()));
    }
    if (!keys.containsKey(activeKeyId)) {
      throw new CryptoException("active-key-id " + activeKeyId + " not found in crypto.keys");
    }
  }

  static SecretKey decodeAes256(String id, String base64) {
    try {
      byte[] raw = Base64.getDecoder().decode(base64.trim());
      if (raw.length != 32) {
        throw new CryptoException("key " + id + " must be 32 bytes (AES-256), got " + raw.length);
      }
      return new SecretKeySpec(raw, "AES");
    } catch (IllegalArgumentException ex) {
      throw new CryptoException("key " + id + " is not valid Base64", ex);
    }
  }

  @Override
  public String activeKeyId() {
    return activeKeyId;
  }

  @Override
  public SecretKey requireKey(String keyId) {
    SecretKey key = keys.get(keyId);
    if (key == null) {
      throw new CryptoException("unknown key id: " + keyId);
    }
    return key;
  }
}
