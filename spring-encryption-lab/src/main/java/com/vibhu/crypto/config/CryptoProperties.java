package com.vibhu.crypto.config;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "crypto")
public class CryptoProperties {
  /** Key id used for new ciphertext (rotation). */
  private String activeKeyId = "v2";

  /** Base64-encoded AES-256 keys keyed by id. */
  private Map<String, String> keys = new LinkedHashMap<>();

  /** HMAC key for searchable lookup hashes (not reversible encryption). */
  private String lookupHmacSecret = "";

  private final Rsa rsa = new Rsa();

  public String getActiveKeyId() {
    return activeKeyId;
  }

  public void setActiveKeyId(String activeKeyId) {
    this.activeKeyId = activeKeyId;
  }

  public Map<String, String> getKeys() {
    return keys;
  }

  public void setKeys(Map<String, String> keys) {
    this.keys = keys;
  }

  public String getLookupHmacSecret() {
    return lookupHmacSecret;
  }

  public void setLookupHmacSecret(String lookupHmacSecret) {
    this.lookupHmacSecret = lookupHmacSecret;
  }

  public Rsa getRsa() {
    return rsa;
  }

  public static class Rsa {
    private String publicPem = "";
    private String privatePem = "";

    public String getPublicPem() {
      return publicPem;
    }

    public void setPublicPem(String publicPem) {
      this.publicPem = publicPem;
    }

    public String getPrivatePem() {
      return privatePem;
    }

    public void setPrivatePem(String privatePem) {
      this.privatePem = privatePem;
    }
  }
}
