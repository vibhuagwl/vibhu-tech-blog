package com.vibhu.crypto.config;

import com.vibhu.crypto.config.CryptoProperties.Rsa;
import com.vibhu.crypto.exception.CryptoException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Loads RSA-3072 from PEM env vars, or generates an ephemeral pair for the local lab.
 * Private keys must never be committed to Git.
 */
@Configuration
public class RsaKeyConfig {

  @Bean
  RSAPublicKey rsaPublicKey(CryptoProperties properties) throws Exception {
    return (RSAPublicKey) loadOrGenerate(properties).getPublic();
  }

  @Bean
  RSAPrivateKey rsaPrivateKey(CryptoProperties properties) throws Exception {
    return (RSAPrivateKey) loadOrGenerate(properties).getPrivate();
  }

  private static KeyPair cached;

  private static synchronized KeyPair loadOrGenerate(CryptoProperties properties) throws Exception {
    if (cached != null) {
      return cached;
    }
    Rsa rsa = properties.getRsa();
    if (rsa.getPublicPem() != null
        && !rsa.getPublicPem().isBlank()
        && rsa.getPrivatePem() != null
        && !rsa.getPrivatePem().isBlank()) {
      PublicKey pub = parsePublic(rsa.getPublicPem());
      PrivateKey priv = parsePrivate(rsa.getPrivatePem());
      cached = new KeyPair(pub, priv);
      return cached;
    }
    KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
    gen.initialize(3072);
    cached = gen.generateKeyPair();
    return cached;
  }

  static PublicKey parsePublic(String pem) throws Exception {
    byte[] der = decodePem(pem, "PUBLIC KEY");
    return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
  }

  static PrivateKey parsePrivate(String pem) throws Exception {
    byte[] der = decodePem(pem, "PRIVATE KEY");
    return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
  }

  static byte[] decodePem(String pem, String type) {
    String normalized =
        pem.replace("-----BEGIN " + type + "-----", "")
            .replace("-----END " + type + "-----", "")
            .replaceAll("\\s", "");
    try {
      return Base64.getDecoder().decode(normalized);
    } catch (IllegalArgumentException ex) {
      throw new CryptoException("invalid PEM " + type, ex);
    }
  }
}
