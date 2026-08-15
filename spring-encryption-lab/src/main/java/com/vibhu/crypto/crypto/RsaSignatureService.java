package com.vibhu.crypto.crypto;

import com.vibhu.crypto.exception.CryptoException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Signature;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import org.springframework.stereotype.Service;

/**
 * RSA-PSS signatures (authenticity + integrity). Not confidentiality. Private key signs; public key
 * verifies.
 */
@Service
public class RsaSignatureService {
  public static final String ALG = "RSASSA-PSS";

  private final RSAPrivateKey privateKey;
  private final RSAPublicKey publicKey;

  public RsaSignatureService(RSAPrivateKey privateKey, RSAPublicKey publicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  public String sign(String payload) {
    try {
      Signature sig = Signature.getInstance(ALG);
      sig.setParameter(
          new java.security.spec.PSSParameterSpec(
              "SHA-256", "MGF1", java.security.spec.MGF1ParameterSpec.SHA256, 32, 1));
      sig.initSign(privateKey);
      sig.update(payload.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(sig.sign());
    } catch (GeneralSecurityException ex) {
      throw new CryptoException("sign failed", ex);
    }
  }

  public boolean verify(String payload, String signatureB64) {
    try {
      Signature sig = Signature.getInstance(ALG);
      sig.setParameter(
          new java.security.spec.PSSParameterSpec(
              "SHA-256", "MGF1", java.security.spec.MGF1ParameterSpec.SHA256, 32, 1));
      sig.initVerify(publicKey);
      sig.update(payload.getBytes(StandardCharsets.UTF_8));
      return sig.verify(Base64.getUrlDecoder().decode(signatureB64));
    } catch (GeneralSecurityException | IllegalArgumentException ex) {
      return false;
    }
  }
}
