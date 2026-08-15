package com.vibhu.crypto.web;

import com.vibhu.crypto.crypto.EncryptionService;
import com.vibhu.crypto.crypto.HmacService;
import com.vibhu.crypto.crypto.HybridEncryptionService;
import com.vibhu.crypto.crypto.HybridEncryptionService.HybridCiphertext;
import com.vibhu.crypto.crypto.RsaSignatureService;
import com.vibhu.crypto.dto.DecryptRequest;
import com.vibhu.crypto.dto.EncryptRequest;
import com.vibhu.crypto.dto.EncryptResponse;
import com.vibhu.crypto.dto.HybridEncryptRequest;
import com.vibhu.crypto.dto.HybridPacket;
import com.vibhu.crypto.dto.SignedPaymentRequest;
import com.vibhu.crypto.ecc.EccCryptoService;
import com.vibhu.crypto.exception.CryptoException;
import com.vibhu.crypto.kms.EnvelopeEncryptionService;
import com.vibhu.crypto.password.PasswordHashingDemo;
import com.vibhu.crypto.tenant.TenantEncryptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Demo API: HTTP → Controller → Decrypt/Verify → Business → Encrypt Response. Never log PAN, JWT,
 * keys, or plaintext secrets.
 */
@RestController
@RequestMapping("/api/crypto")
public class CryptoController {

  private final EncryptionService encryption;
  private final HybridEncryptionService hybrid;
  private final RsaSignatureService signatures;
  private final HmacService hmac;
  private final EnvelopeEncryptionService envelope;
  private final TenantEncryptionService tenants;
  private final EccCryptoService ecc;
  private final PasswordHashingDemo passwords;

  public CryptoController(
      EncryptionService encryption,
      HybridEncryptionService hybrid,
      RsaSignatureService signatures,
      HmacService hmac,
      EnvelopeEncryptionService envelope,
      TenantEncryptionService tenants,
      EccCryptoService ecc,
      PasswordHashingDemo passwords) {
    this.encryption = encryption;
    this.hybrid = hybrid;
    this.signatures = signatures;
    this.hmac = hmac;
    this.envelope = envelope;
    this.tenants = tenants;
    this.ecc = ecc;
    this.passwords = passwords;
  }

  @PostMapping("/encrypt")
  public EncryptResponse encrypt(@Valid @RequestBody EncryptRequest request) {
    return new EncryptResponse(encryption.encrypt(request.plaintext()));
  }

  @PostMapping("/decrypt")
  public Map<String, String> decrypt(@Valid @RequestBody DecryptRequest request) {
    return Map.of("plaintext", encryption.decrypt(request.ciphertext()));
  }

  @PostMapping("/reencrypt")
  public EncryptResponse reencrypt(@Valid @RequestBody DecryptRequest request) {
    return new EncryptResponse(encryption.reencrypt(request.ciphertext()));
  }

  @PostMapping("/hybrid/encrypt")
  public HybridPacket hybridEncrypt(@Valid @RequestBody HybridEncryptRequest request) {
    HybridCiphertext ct = hybrid.encryptForServer(request.plaintext());
    return new HybridPacket(ct.encryptedDek(), ct.payload());
  }

  @PostMapping("/hybrid/decrypt")
  public Map<String, String> hybridDecrypt(@Valid @RequestBody HybridPacket packet) {
    String pt =
        hybrid.decryptOnServer(new HybridCiphertext(packet.encryptedDek(), packet.payload()));
    return Map.of("plaintext", pt);
  }

  @PostMapping("/payments/signed")
  public Map<String, Object> processSignedPayment(
      @Valid @RequestBody SignedPaymentRequest request) {
    if (!signatures.verify(request.payload(), request.signature())) {
      throw new CryptoException("invalid payment signature");
    }
    // Business processing would happen here — signature ≠ encryption.
    return Map.of("accepted", true, "payloadHash", hmac.sign(request.payload()));
  }

  @PostMapping("/sign")
  public Map<String, String> sign(@Valid @RequestBody EncryptRequest request) {
    return Map.of("signature", signatures.sign(request.plaintext()));
  }

  @PostMapping("/hmac")
  public Map<String, String> hmac(@Valid @RequestBody EncryptRequest request) {
    return Map.of("mac", hmac.sign(request.plaintext()));
  }

  @PostMapping("/envelope/encrypt")
  public Map<String, String> envelopeEncrypt(@Valid @RequestBody EnvelopeRequest request) {
    return Map.of("wire", envelope.encryptToWireFormat(request.kekId(), request.plaintext()));
  }

  @PostMapping("/envelope/decrypt")
  public Map<String, String> envelopeDecrypt(@Valid @RequestBody EnvelopeWireRequest request) {
    return Map.of("plaintext", envelope.decryptFromWireFormat(request.wire()));
  }

  @PostMapping("/tenant/encrypt")
  public Map<String, String> tenantEncrypt(@Valid @RequestBody TenantRequest request) {
    return Map.of("ciphertext", tenants.encrypt(request.tenantId(), request.plaintext()));
  }

  @PostMapping("/tenant/decrypt")
  public Map<String, String> tenantDecrypt(@Valid @RequestBody TenantDecryptRequest request) {
    return Map.of("plaintext", tenants.decrypt(request.tenantId(), request.ciphertext()));
  }

  @GetMapping("/ecc/demo")
  public Map<String, Object> eccDemo() {
    byte[] payload = "payment-ref-42".getBytes(StandardCharsets.UTF_8);
    byte[] sig = ecc.signEcdsa(payload);
    byte[] a = ecc.deriveSharedSecretFromA();
    byte[] b = ecc.deriveSharedSecretFromB();
    return Map.of(
        "ecdsaValid",
        ecc.verifyEcdsa(payload, sig),
        "ecdhSecretsMatch",
        Arrays.equals(a, b),
        "signature",
        Base64.getUrlEncoder().withoutPadding().encodeToString(sig));
  }

  @PostMapping("/password/hash")
  public Map<String, String> hashPassword(@Valid @RequestBody PasswordRequest request) {
    return Map.of(
        "argon2",
        passwords.hashArgon2(request.password()),
        "bcrypt",
        passwords.hashBcrypt(request.password()));
  }

  @PostMapping("/password/verify")
  public Map<String, Boolean> verifyPassword(@Valid @RequestBody PasswordVerifyRequest request) {
    return Map.of(
        "argon2",
        passwords.matchesArgon2(request.password(), request.argon2Hash()),
        "bcrypt",
        passwords.matchesBcrypt(request.password(), request.bcryptHash()));
  }

  @GetMapping("/health-crypto")
  public ResponseEntity<Map<String, String>> health() {
    return ResponseEntity.ok(Map.of("status", "up", "activeAlgo", "AES/GCM/NoPadding"));
  }

  public record EnvelopeRequest(@NotBlank String kekId, @NotBlank String plaintext) {}

  public record EnvelopeWireRequest(@NotBlank String wire) {}

  public record TenantRequest(@NotBlank String tenantId, @NotBlank String plaintext) {}

  public record TenantDecryptRequest(@NotBlank String tenantId, @NotBlank String ciphertext) {}

  public record PasswordRequest(@NotBlank String password) {}

  public record PasswordVerifyRequest(
      @NotBlank String password, @NotBlank String argon2Hash, @NotBlank String bcryptHash) {}
}
