package com.vibhu.crypto.pki;

import com.vibhu.crypto.crypto.AesEncryptionService;
import com.vibhu.crypto.exception.CryptoException;
import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.TrustAnchor;
import java.security.cert.X509Certificate;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PSSParameterSpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.BasicConstraints;
import org.bouncycastle.asn1.x509.ExtendedKeyUsage;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.asn1.x509.GeneralName;
import org.bouncycastle.asn1.x509.GeneralNames;
import org.bouncycastle.asn1.x509.KeyPurposeId;
import org.bouncycastle.asn1.x509.KeyUsage;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.stereotype.Service;

/**
 * In-process lab PKI: Root CA, leaf issuance, PKIX trust, hostname/SAN, CRL, sign, encrypt-to-cert.
 *
 * <p>Production: use a real CA / ACME / AWS PCA / cert-manager. Never keep a root private key in the app JVM.
 */
@Service
public class PkiService {
  public static final String RSA_OAEP = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
  public static final String RSA_PSS = "RSASSA-PSS";

  private final AesEncryptionService aes;
  private final SecureRandom random = new SecureRandom();
  private final KeyPair rootKeys;
  private final X509Certificate rootCert;
  private final ConcurrentHashMap<String, IssuedKey> issued = new ConcurrentHashMap<>();
  private final Set<BigInteger> revoked = ConcurrentHashMap.newKeySet();

  public PkiService(AesEncryptionService aes) {
    this.aes = aes;
    try {
      KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
      kpg.initialize(2048, random);
      this.rootKeys = kpg.generateKeyPair();
      Instant now = Instant.now();
      this.rootCert =
          buildCertificate(
              new X500Name("CN=Vibhu Lab Root CA,O=Vibhu Tech Lab"),
              new X500Name("CN=Vibhu Lab Root CA,O=Vibhu Tech Lab"),
              rootKeys.getPublic(),
              rootKeys.getPrivate(),
              now.minus(Duration.ofDays(1)),
              now.plus(Duration.ofDays(3650)),
              true,
              List.of());
    } catch (Exception ex) {
      throw new CryptoException("lab CA init failed", ex);
    }
  }

  public String rootCertificatePem() {
    return toPem("CERTIFICATE", encode(rootCert));
  }

  public String rootSubject() {
    return rootCert.getSubjectX500Principal().getName();
  }

  public IssuedCert issue(String cn, List<String> san) {
    return issue(cn, san, Duration.ofDays(90));
  }

  public IssuedCert issue(String cn, List<String> san, Duration validity) {
    if (cn == null || cn.isBlank()) {
      throw new CryptoException("cn required");
    }
    List<String> names = san == null || san.isEmpty() ? List.of(cn.replaceFirst("^CN=", "")) : List.copyOf(san);
    try {
      KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
      kpg.initialize(2048, random);
      KeyPair leafKeys = kpg.generateKeyPair();
      Instant now = Instant.now();
      Instant notAfter = validity.isNegative() || validity.isZero() ? now.minus(Duration.ofHours(1)) : now.plus(validity);
      Instant notBefore = validity.isNegative() || validity.isZero() ? now.minus(Duration.ofDays(2)) : now.minus(Duration.ofMinutes(1));
      X509Certificate leaf =
          buildCertificate(
              new X500Name("CN=Vibhu Lab Root CA,O=Vibhu Tech Lab"),
              new X500Name(cn),
              leafKeys.getPublic(),
              rootKeys.getPrivate(),
              notBefore,
              notAfter,
              false,
              names);
      String serial = leaf.getSerialNumber().toString(16);
      issued.put(serial, new IssuedKey(leaf, leafKeys.getPrivate()));
      return new IssuedCert(
          serial,
          leaf.getSubjectX500Principal().getName(),
          names,
          toPem("CERTIFICATE", leaf.getEncoded()),
          toPem("PRIVATE KEY", leafKeys.getPrivate().getEncoded()),
          notBefore,
          notAfter);
    } catch (CryptoException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new CryptoException("issue failed", ex);
    }
  }

  public ValidateResult validate(String certificatePem, String hostname) {
    X509Certificate leaf = parsePem(certificatePem);
    boolean notExpired = true;
    try {
      leaf.checkValidity();
    } catch (Exception ex) {
      notExpired = false;
    }
    boolean hostnameOk = hostname == null || hostname.isBlank() || matchesHostname(leaf, hostname);
    boolean notRevoked = !revoked.contains(leaf.getSerialNumber());
    boolean chainOk = false;
    String reason = "ok";
    try {
      TrustAnchor anchor = new TrustAnchor(rootCert, null);
      PKIXParameters params = new PKIXParameters(Set.of(anchor));
      params.setRevocationEnabled(false);
      params.setDate(new Date());
      CertPath path = CertificateFactory.getInstance("X.509").generateCertPath(List.of((Certificate) leaf));
      CertPathValidator.getInstance("PKIX").validate(path, params);
      chainOk = true;
    } catch (Exception ex) {
      reason = "untrusted_chain";
    }
    if (!notExpired) {
      reason = "expired";
    } else if (!notRevoked) {
      reason = "revoked";
    } else if (!hostnameOk) {
      reason = "hostname_mismatch";
    } else if (!chainOk) {
      reason = "untrusted_chain";
    }
    boolean trusted = chainOk && notExpired && hostnameOk && notRevoked;
    return new ValidateResult(
        trusted,
        chainOk,
        hostnameOk,
        notRevoked,
        notExpired,
        leaf.getSubjectX500Principal().getName(),
        leaf.getSerialNumber().toString(16),
        trusted ? "ok" : reason);
  }

  public void revoke(String serialHex) {
    BigInteger serial = new BigInteger(serialHex, 16);
    revoked.add(serial);
  }

  public String sign(String serialHex, String payload) {
    IssuedKey key = requireIssued(serialHex);
    try {
      Signature sig = pss();
      sig.initSign(key.privateKey());
      sig.update(payload.getBytes(StandardCharsets.UTF_8));
      return b64(sig.sign());
    } catch (Exception ex) {
      throw new CryptoException("pki sign failed", ex);
    }
  }

  public boolean verify(String certificatePem, String payload, String signatureB64) {
    ValidateResult trust = validate(certificatePem, "");
    if (!trust.chainOk() || !trust.notExpired() || !trust.notRevoked()) {
      return false;
    }
    try {
      Signature sig = pss();
      sig.initVerify(parsePem(certificatePem).getPublicKey());
      sig.update(payload.getBytes(StandardCharsets.UTF_8));
      return sig.verify(unb64(signatureB64));
    } catch (Exception ex) {
      return false;
    }
  }

  public HybridPacket encryptToCertificate(String certificatePem, String plaintext) {
    ValidateResult trust = validate(certificatePem, "");
    if (!trust.chainOk() || !trust.notExpired() || !trust.notRevoked()) {
      throw new CryptoException("cannot encrypt to untrusted certificate");
    }
    try {
      KeyGenerator kg = KeyGenerator.getInstance("AES");
      kg.init(256, random);
      SecretKey dek = kg.generateKey();
      Cipher rsa = Cipher.getInstance(RSA_OAEP);
      rsa.init(Cipher.ENCRYPT_MODE, parsePem(certificatePem).getPublicKey());
      byte[] wrapped = rsa.doFinal(dek.getEncoded());
      byte[] blob = aes.encryptBytes(dek, plaintext.getBytes(StandardCharsets.UTF_8));
      return new HybridPacket(b64(wrapped), b64(blob));
    } catch (CryptoException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new CryptoException("encrypt-to-cert failed", ex);
    }
  }

  public String decryptWithSerial(String serialHex, HybridPacket packet) {
    IssuedKey key = requireIssued(serialHex);
    try {
      Cipher rsa = Cipher.getInstance(RSA_OAEP);
      rsa.init(Cipher.DECRYPT_MODE, key.privateKey());
      byte[] raw = rsa.doFinal(unb64(packet.encryptedDek()));
      SecretKey dek = new SecretKeySpec(raw, "AES");
      byte[] pt = aes.decryptBytes(dek, unb64(packet.payload()));
      return new String(pt, StandardCharsets.UTF_8);
    } catch (CryptoException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new CryptoException("decrypt-with-serial failed", ex);
    }
  }

  public X509Certificate parsePem(String pem) {
    if (pem == null || pem.isBlank()) {
      throw new CryptoException("certificatePem required");
    }
    try {
      CertificateFactory cf = CertificateFactory.getInstance("X.509");
      return (X509Certificate)
          cf.generateCertificate(new ByteArrayInputStream(pem.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new CryptoException("invalid certificate PEM", ex);
    }
  }

  private IssuedKey requireIssued(String serialHex) {
    IssuedKey key = issued.get(serialHex);
    if (key == null) {
      throw new CryptoException("unknown serial");
    }
    if (revoked.contains(key.cert().getSerialNumber())) {
      throw new CryptoException("serial revoked");
    }
    return key;
  }

  private X509Certificate buildCertificate(
      X500Name issuer,
      X500Name subject,
      PublicKey subjectKey,
      PrivateKey signerKey,
      Instant notBefore,
      Instant notAfter,
      boolean ca,
      List<String> san)
      throws Exception {
    BigInteger serial = new BigInteger(64, random).abs();
    JcaX509v3CertificateBuilder builder =
        new JcaX509v3CertificateBuilder(issuer, serial, Date.from(notBefore), Date.from(notAfter), subject, subjectKey);
    builder.addExtension(Extension.basicConstraints, true, new BasicConstraints(ca));
    if (ca) {
      builder.addExtension(Extension.keyUsage, true, new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign));
    } else {
      builder.addExtension(
          Extension.keyUsage, true, new KeyUsage(KeyUsage.digitalSignature | KeyUsage.keyEncipherment));
      builder.addExtension(
          Extension.extendedKeyUsage,
          false,
          new ExtendedKeyUsage(new KeyPurposeId[] {KeyPurposeId.id_kp_serverAuth, KeyPurposeId.id_kp_clientAuth}));
      if (!san.isEmpty()) {
        GeneralName[] names = new GeneralName[san.size()];
        for (int i = 0; i < san.size(); i++) {
          names[i] = new GeneralName(GeneralName.dNSName, san.get(i));
        }
        builder.addExtension(Extension.subjectAlternativeName, false, new GeneralNames(names));
      }
    }
    ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA").build(signerKey);
    return new JcaX509CertificateConverter().getCertificate(builder.build(signer));
  }

  static boolean matchesHostname(X509Certificate cert, String hostname) {
    String host = hostname.toLowerCase(Locale.ROOT);
    try {
      Collection<List<?>> alt = cert.getSubjectAlternativeNames();
      if (alt != null) {
        for (List<?> item : alt) {
          if (item.size() >= 2 && Integer.valueOf(2).equals(item.get(0))) {
            String dns = String.valueOf(item.get(1)).toLowerCase(Locale.ROOT);
            if (dns.equals(host)) {
              return true;
            }
          }
        }
      }
    } catch (Exception ex) {
      return false;
    }
    return false;
  }

  private static Signature pss() throws Exception {
    Signature sig = Signature.getInstance(RSA_PSS);
    sig.setParameter(new PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1));
    return sig;
  }

  private static byte[] encode(X509Certificate cert) {
    try {
      return cert.getEncoded();
    } catch (Exception ex) {
      throw new CryptoException("encode cert failed", ex);
    }
  }

  static String toPem(String type, byte[] der) {
    String b64 = Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(der);
    return "-----BEGIN " + type + "-----\n" + b64 + "\n-----END " + type + "-----\n";
  }

  private static String b64(byte[] raw) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
  }

  private static byte[] unb64(String s) {
    return Base64.getUrlDecoder().decode(s);
  }

  public record IssuedCert(
      String serial,
      String subject,
      List<String> san,
      String certificatePem,
      String privateKeyPem,
      Instant notBefore,
      Instant notAfter) {
    public IssuedCert {
      san = san == null ? List.of() : List.copyOf(san);
    }
  }

  public record ValidateResult(
      boolean trusted,
      boolean chainOk,
      boolean hostnameOk,
      boolean notRevoked,
      boolean notExpired,
      String subject,
      String serial,
      String reason) {}

  public record HybridPacket(String encryptedDek, String payload) {}

  private record IssuedKey(X509Certificate cert, PrivateKey privateKey) {}
}
