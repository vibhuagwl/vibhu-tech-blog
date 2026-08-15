package com.vibhu.crypto.ecc;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import javax.crypto.KeyAgreement;
import org.springframework.stereotype.Service;

/**
 * ECC demos: ECDSA (signatures) vs ECDH (key agreement). Do not mix the two.
 *
 * <p>Prefer ECC over RSA when key size / performance matters at equivalent security (e.g. P-256 ≈
 * RSA-3072 for classical security estimates).
 */
@Service
public class EccCryptoService {

  private final KeyPair ecdsaPair;
  private final KeyPair ecdhPairA;
  private final KeyPair ecdhPairB;

  public EccCryptoService() {
    try {
      KeyPairGenerator ecdsa = KeyPairGenerator.getInstance("EC");
      ecdsa.initialize(new ECGenParameterSpec("secp256r1"), new SecureRandom());
      this.ecdsaPair = ecdsa.generateKeyPair();

      KeyPairGenerator ecdh = KeyPairGenerator.getInstance("EC");
      ecdh.initialize(new ECGenParameterSpec("secp256r1"), new SecureRandom());
      this.ecdhPairA = ecdh.generateKeyPair();
      this.ecdhPairB = ecdh.generateKeyPair();
    } catch (Exception e) {
      throw new IllegalStateException("Failed to init ECC keys", e);
    }
  }

  /** ECDSA = digital signature (authenticity / integrity), not confidentiality. */
  public byte[] signEcdsa(byte[] payload) {
    try {
      Signature sig = Signature.getInstance("SHA256withECDSA");
      sig.initSign(ecdsaPair.getPrivate());
      sig.update(payload);
      return sig.sign();
    } catch (Exception e) {
      throw new IllegalStateException("ECDSA sign failed", e);
    }
  }

  public boolean verifyEcdsa(byte[] payload, byte[] signature) {
    try {
      Signature sig = Signature.getInstance("SHA256withECDSA");
      sig.initVerify(ecdsaPair.getPublic());
      sig.update(payload);
      return sig.verify(signature);
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * ECDH = key agreement. Both parties derive the same shared secret; then use AES-GCM for bulk
   * data (hybrid pattern).
   */
  public byte[] deriveSharedSecretFromA() {
    try {
      KeyAgreement ka = KeyAgreement.getInstance("ECDH");
      ka.init(ecdhPairA.getPrivate());
      ka.doPhase(ecdhPairB.getPublic(), true);
      return ka.generateSecret();
    } catch (Exception e) {
      throw new IllegalStateException("ECDH failed", e);
    }
  }

  public byte[] deriveSharedSecretFromB() {
    try {
      KeyAgreement ka = KeyAgreement.getInstance("ECDH");
      ka.init(ecdhPairB.getPrivate());
      ka.doPhase(ecdhPairA.getPublic(), true);
      return ka.generateSecret();
    } catch (Exception e) {
      throw new IllegalStateException("ECDH failed", e);
    }
  }
}
