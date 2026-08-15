package com.vibhu.crypto.crypto;

import com.vibhu.crypto.exception.CryptoException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * Hybrid encryption: AES-GCM for the payload, RSA-OAEP for the ephemeral DEK. Never RSA-encrypt
 * large JSON directly.
 */
@Service
public class HybridEncryptionService {
  public static final String RSA_OAEP = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";

  private final AesEncryptionService aes;
  private final RSAPublicKey publicKey;
  private final RSAPrivateKey privateKey;

  public HybridEncryptionService(
      AesEncryptionService aes, RSAPublicKey publicKey, RSAPrivateKey privateKey) {
    this.aes = aes;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  public record HybridCiphertext(String encryptedDek, String payload) {}

  public HybridCiphertext encryptForServer(String plaintext) {
    try {
      KeyGenerator kg = KeyGenerator.getInstance("AES");
      kg.init(256, new SecureRandom());
      SecretKey dek = kg.generateKey();
      byte[] wrapped = wrapDek(dek);
      byte[] blob = aes.encryptBytes(dek, plaintext.getBytes(StandardCharsets.UTF_8));
      return new HybridCiphertext(b64(wrapped), b64(blob));
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("hybrid encrypt failed", ex);
    }
  }

  public String decryptOnServer(HybridCiphertext packet) {
    SecretKey dek = unwrapDek(unb64(packet.encryptedDek()));
    byte[] pt = aes.decryptBytes(dek, unb64(packet.payload()));
    return new String(pt, StandardCharsets.UTF_8);
  }

  private byte[] wrapDek(SecretKey dek) throws GeneralSecurityException {
    Cipher cipher = Cipher.getInstance(RSA_OAEP);
    cipher.init(Cipher.ENCRYPT_MODE, publicKey);
    return cipher.doFinal(dek.getEncoded());
  }

  private SecretKey unwrapDek(byte[] wrapped) {
    try {
      Cipher cipher = Cipher.getInstance(RSA_OAEP);
      cipher.init(Cipher.DECRYPT_MODE, privateKey);
      byte[] raw = cipher.doFinal(wrapped);
      return new SecretKeySpec(raw, "AES");
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("DEK unwrap failed", ex);
    }
  }

  private static String b64(byte[] raw) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
  }

  private static byte[] unb64(String s) {
    return Base64.getUrlDecoder().decode(s);
  }
}
