package com.vibhu.crypto.pki;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.crypto.exception.CryptoException;
import com.vibhu.crypto.pki.PkiService.HybridPacket;
import com.vibhu.crypto.pki.PkiService.IssuedCert;
import com.vibhu.crypto.pki.PkiService.ValidateResult;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class PkiServiceTest {

  @Autowired PkiService pki;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;

  @Test
  void issueValidateSignEncryptRoundTrip() {
    IssuedCert leaf = pki.issue("CN=payments.example", List.of("payments.example"));
    ValidateResult ok = pki.validate(leaf.certificatePem(), "payments.example");
    assertThat(ok.trusted()).isTrue();
    assertThat(ok.hostnameOk()).isTrue();
    assertThat(ok.chainOk()).isTrue();

    ValidateResult wrongHost = pki.validate(leaf.certificatePem(), "evil.example");
    assertThat(wrongHost.trusted()).isFalse();
    assertThat(wrongHost.reason()).isEqualTo("hostname_mismatch");

    String sig = pki.sign(leaf.serial(), "pay:42");
    assertThat(pki.verify(leaf.certificatePem(), "pay:42", sig)).isTrue();
    assertThat(pki.verify(leaf.certificatePem(), "pay:43", sig)).isFalse();

    HybridPacket packet = pki.encryptToCertificate(leaf.certificatePem(), "tax-id-99");
    assertThat(pki.decryptWithSerial(leaf.serial(), packet)).isEqualTo("tax-id-99");
  }

  @Test
  void revokedAndExpiredAreRejected() {
    IssuedCert leaf = pki.issue("CN=payments.example", List.of("payments.example"));
    pki.revoke(leaf.serial());
    ValidateResult revoked = pki.validate(leaf.certificatePem(), "payments.example");
    assertThat(revoked.trusted()).isFalse();
    assertThat(revoked.reason()).isEqualTo("revoked");
    assertThat(pki.verify(leaf.certificatePem(), "pay:42", "e30")).isFalse();

    IssuedCert expired = pki.issue("CN=old.example", List.of("old.example"), Duration.ZERO);
    ValidateResult expiredResult = pki.validate(expired.certificatePem(), "old.example");
    assertThat(expiredResult.trusted()).isFalse();
    assertThat(expiredResult.notExpired()).isFalse();

    assertThatThrownBy(() -> pki.encryptToCertificate(expired.certificatePem(), "x"))
        .isInstanceOf(CryptoException.class);
  }

  @Test
  void pkiApiIssueAndValidate() throws Exception {
    mvc.perform(get("/api/crypto/pki/ca"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.certificatePem").isNotEmpty());

    MvcResult issued =
        mvc.perform(
                post("/api/crypto/pki/issue")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"cn\":\"CN=payments.example\",\"san\":[\"payments.example\"]}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.serial").isNotEmpty())
            .andReturn();
    JsonNode body = mapper.readTree(issued.getResponse().getContentAsString());
    String pem = mapper.writeValueAsString(body.get("certificatePem").asText());

    mvc.perform(
            post("/api/crypto/pki/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"certificatePem\":" + pem + ",\"hostname\":\"payments.example\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.trusted").value(true));

    mvc.perform(
            post("/api/crypto/pki/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"certificatePem\":" + pem + ",\"hostname\":\"evil.example\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.trusted").value(false))
        .andExpect(jsonPath("$.reason").value("hostname_mismatch"));
  }
}
