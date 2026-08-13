package com.vibhu.crypto.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.crypto.exception.CryptoException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class HybridAndSignatureIT {

  @Autowired AesEncryptionService aes;
  @Autowired HybridEncryptionService hybrid;
  @Autowired RsaSignatureService signatures;
  @Autowired HmacService hmac;
  @Autowired RSAPublicKey publicKey;
  @Autowired RSAPrivateKey privateKey;

  @Test
  void hybridRoundTrip() {
    var packet = hybrid.encryptForServer("{\"amount\":100,\"pan\":\"4111\"}");
    assertThat(packet.encryptedDek()).isNotBlank();
    assertThat(hybrid.decryptOnServer(packet)).contains("4111");
  }

  @Test
  void tamperedHybridPayloadFails() {
    var packet = hybrid.encryptForServer("hello");
    String badPayload = packet.payload().substring(0, packet.payload().length() - 2) + "aa";
    assertThatThrownBy(
            () -> hybrid.decryptOnServer(new HybridEncryptionService.HybridCiphertext(packet.encryptedDek(), badPayload)))
        .isInstanceOf(CryptoException.class);
  }

  @Test
  void rsaPssSignVerify() {
    String sig = signatures.sign("pay:42");
    assertThat(signatures.verify("pay:42", sig)).isTrue();
    assertThat(signatures.verify("pay:43", sig)).isFalse();
  }

  @Test
  void hmacConstantTimeVerify() {
    String mac = hmac.sign("body");
    assertThat(hmac.verify("body", mac)).isTrue();
    assertThat(hmac.verify("body", mac + "x")).isFalse();
  }

  @Test
  void rsaKeysAre3072() {
    assertThat(publicKey.getModulus().bitLength()).isGreaterThanOrEqualTo(3072);
    assertThat(privateKey.getModulus().bitLength()).isGreaterThanOrEqualTo(3072);
  }
}
