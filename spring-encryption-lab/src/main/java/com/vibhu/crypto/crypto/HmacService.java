package com.vibhu.crypto.crypto;

import com.vibhu.crypto.config.CryptoProperties;
import com.vibhu.crypto.exception.CryptoException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * HMAC-SHA256 for integrity / API request signing / searchable lookup digests. Shared secret — not
 * a substitute for digital signatures (no non-repudiation).
 */
@Service
public class HmacService {
  private static final String ALG = "HmacSHA256";
  private final byte[] secret;

  public HmacService(CryptoProperties properties) {
    String s = properties.getLookupHmacSecret();
    if (s == null || s.getBytes(StandardCharsets.UTF_8).length < 32) {
      throw new CryptoException("crypto.lookup-hmac-secret must be at least 32 bytes");
    }
    this.secret = s.getBytes(StandardCharsets.UTF_8);
  }

  public String sign(String message) {
    try {
      Mac mac = Mac.getInstance(ALG);
      mac.init(new SecretKeySpec(secret, ALG));
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("hmac failed", ex);
    }
  }

  public boolean verify(String message, String signature) {
    if (signature == null) {
      return false;
    }
    String expected = sign(message);
    return constantTimeEquals(expected, signature);
  }

  /** Deterministic lookup digest for searchable encryption (see AccountNumberIndex). */
  public String lookupDigest(String normalizedPlaintext) {
    return sign("lookup:" + normalizedPlaintext);
  }

  static boolean constantTimeEquals(String a, String b) {
    if (a.length() != b.length()) {
      return false;
    }
    int r = 0;
    for (int i = 0; i < a.length(); i++) {
      r |= a.charAt(i) ^ b.charAt(i);
    }
    return r == 0;
  }
}
