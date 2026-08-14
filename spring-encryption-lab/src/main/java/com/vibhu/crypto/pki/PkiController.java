package com.vibhu.crypto.pki;

import com.vibhu.crypto.pki.PkiService.HybridPacket;
import com.vibhu.crypto.pki.PkiService.IssuedCert;
import com.vibhu.crypto.pki.PkiService.ValidateResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lab PKI API: issue → validate chain/SAN/CRL → sign / encrypt-to-cert.
 * Private keys in issue responses are for local learning only.
 */
@RestController
@RequestMapping("/api/crypto/pki")
public class PkiController {
  private final PkiService pki;

  public PkiController(PkiService pki) {
    this.pki = pki;
  }

  @GetMapping("/ca")
  public Map<String, String> ca() {
    return Map.of("subject", pki.rootSubject(), "certificatePem", pki.rootCertificatePem());
  }

  @PostMapping("/issue")
  public IssuedCert issue(@Valid @RequestBody IssueRequest request) {
    return pki.issue(request.cn(), request.san());
  }

  @PostMapping("/validate")
  public ValidateResult validate(@Valid @RequestBody ValidateRequest request) {
    return pki.validate(request.certificatePem(), request.hostname());
  }

  @PostMapping("/revoke")
  public Map<String, String> revoke(@Valid @RequestBody SerialRequest request) {
    pki.revoke(request.serial());
    return Map.of("serial", request.serial(), "status", "revoked");
  }

  @PostMapping("/sign")
  public Map<String, String> sign(@Valid @RequestBody SignRequest request) {
    return Map.of("signature", pki.sign(request.serial(), request.payload()));
  }

  @PostMapping("/verify")
  public Map<String, Boolean> verify(@Valid @RequestBody VerifyRequest request) {
    return Map.of("valid", pki.verify(request.certificatePem(), request.payload(), request.signature()));
  }

  @PostMapping("/encrypt-to-cert")
  public HybridPacket encryptToCert(@Valid @RequestBody EncryptToCertRequest request) {
    return pki.encryptToCertificate(request.certificatePem(), request.plaintext());
  }

  @PostMapping("/decrypt-with-serial")
  public Map<String, String> decryptWithSerial(@Valid @RequestBody DecryptSerialRequest request) {
    return Map.of(
        "plaintext",
        pki.decryptWithSerial(
            request.serial(), new HybridPacket(request.encryptedDek(), request.payload())));
  }

  public record IssueRequest(@NotBlank String cn, List<String> san) {}

  public record ValidateRequest(@NotBlank String certificatePem, @NotBlank String hostname) {}

  public record SerialRequest(@NotBlank String serial) {}

  public record SignRequest(@NotBlank String serial, @NotBlank String payload) {}

  public record VerifyRequest(
      @NotBlank String certificatePem, @NotBlank String payload, @NotBlank String signature) {}

  public record EncryptToCertRequest(@NotBlank String certificatePem, @NotBlank String plaintext) {}

  public record DecryptSerialRequest(
      @NotBlank String serial, @NotBlank String encryptedDek, @NotBlank String payload) {}
}
