package com.vibhu.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.crypto.crypto.EncodingVsEncryptionDemo;
import com.vibhu.crypto.crypto.EncryptionService;
import com.vibhu.crypto.ecc.EccCryptoService;
import com.vibhu.crypto.exception.CryptoException;
import com.vibhu.crypto.kms.EnvelopeEncryptionService;
import com.vibhu.crypto.password.PasswordHashingDemo;
import com.vibhu.crypto.tenant.TenantEncryptionService;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class EncryptionLabIT {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired EncryptionService encryption;
  @Autowired EnvelopeEncryptionService envelope;
  @Autowired TenantEncryptionService tenants;
  @Autowired EccCryptoService ecc;
  @Autowired PasswordHashingDemo passwords;

  @Test
  void encryptDecryptApi() throws Exception {
    MvcResult enc =
        mvc.perform(
                post("/api/crypto/encrypt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"plaintext\":\"hello-world\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ciphertext").isNotEmpty())
            .andReturn();
    String ct = mapper.readTree(enc.getResponse().getContentAsString()).get("ciphertext").asText();
    mvc.perform(
            post("/api/crypto/decrypt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"ciphertext\":\"" + ct + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.plaintext").value("hello-world"));
  }

  @Test
  void tamperedCiphertextRejectedByApi() throws Exception {
    String ct = encryption.encrypt("secret");
    String[] parts = ct.split("\\|", 3);
    byte[] raw = java.util.Base64.getUrlDecoder().decode(parts[2]);
    raw[0] ^= 0x5a;
    String bad =
        parts[0]
            + "|"
            + parts[1]
            + "|"
            + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    mvc.perform(
            post("/api/crypto/decrypt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"ciphertext\":\"" + bad + "\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("crypto_failed"));
  }

  @Test
  void customerSearchableEncryption() throws Exception {
    mvc.perform(
            post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"Ada\",\"accountNumber\":\"ACC-1001\",\"pan\":\"4111111111111111\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.panMasked").value("****1111"));

    mvc.perform(get("/api/customers/by-account").param("accountNumber", "ACC-1001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accountNumber").value("ACC-1001"));
  }

  @Test
  void signedPaymentRejectsBadSig() throws Exception {
    MvcResult signed =
        mvc.perform(
                post("/api/crypto/sign")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"plaintext\":\"amount=10\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String sig = mapper.readTree(signed.getResponse().getContentAsString()).get("signature").asText();

    mvc.perform(
            post("/api/crypto/payments/signed")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"payload\":\"amount=10\",\"signature\":\"" + sig + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accepted").value(true));

    mvc.perform(
            post("/api/crypto/payments/signed")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"payload\":\"amount=99\",\"signature\":\"" + sig + "\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void envelopeAndTenant() {
    String wire = envelope.encryptToWireFormat("kek-v2", "pan-data");
    assertThat(envelope.decryptFromWireFormat(wire)).isEqualTo("pan-data");

    String ct = tenants.encrypt("tenant-a", "secret-a");
    assertThat(tenants.decrypt("tenant-a", ct)).isEqualTo("secret-a");
    assertThatThrownBy(() -> tenants.decrypt("tenant-b", ct)).isInstanceOf(CryptoException.class);
  }

  @Test
  void eccAndPasswords() {
    byte[] payload = "x".getBytes(StandardCharsets.UTF_8);
    byte[] sig = ecc.signEcdsa(payload);
    assertThat(ecc.verifyEcdsa(payload, sig)).isTrue();
    assertThat(Arrays.equals(ecc.deriveSharedSecretFromA(), ecc.deriveSharedSecretFromB())).isTrue();

    String a = passwords.hashArgon2("CorrectHorseBattery");
    String b = passwords.hashBcrypt("CorrectHorseBattery");
    assertThat(passwords.matchesArgon2("CorrectHorseBattery", a)).isTrue();
    assertThat(passwords.matchesBcrypt("CorrectHorseBattery", b)).isTrue();
    assertThat(passwords.matchesArgon2("wrong", a)).isFalse();
  }

  @Test
  void hybridApi() throws Exception {
    MvcResult enc =
        mvc.perform(
                post("/api/crypto/hybrid/encrypt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"plaintext\":\"big-json\"}"))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode node = mapper.readTree(enc.getResponse().getContentAsString());
    String body =
        "{\"encryptedDek\":\""
            + node.get("encryptedDek").asText()
            + "\",\"payload\":\""
            + node.get("payload").asText()
            + "\"}";
    mvc.perform(post("/api/crypto/hybrid/decrypt").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.plaintext").value("big-json"));
  }

  @Test
  void encodingIsNotEncryption() {
    String encoded = EncodingVsEncryptionDemo.base64Encode("Hello");
    assertThat(EncodingVsEncryptionDemo.base64Decode(encoded)).isEqualTo("Hello");
    assertThat(EncodingVsEncryptionDemo.sha256("password")).hasSize(32);
  }
}
