package com.vibhu.crypto.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.crypto.config.CryptoProperties;
import com.vibhu.crypto.exception.CryptoException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AesEncryptionServiceTest {

  private AesEncryptionService aes;
  private ConfigAesKeyProvider keys;

  @BeforeEach
  void setUp() {
    CryptoProperties props = new CryptoProperties();
    props.setActiveKeyId("v2");
    Map<String, String> map = new LinkedHashMap<>();
    // 32-byte keys as Base64
    map.put("v1", "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
    map.put("v2", "YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODk=");
    props.setKeys(map);
    keys = new ConfigAesKeyProvider(props);
    aes = new AesEncryptionService(keys);
  }

  @Test
  void encryptDecryptRoundTrip() {
    String ct = aes.encrypt("4111111111111111");
    assertThat(ct).contains("|");
    assertThat(aes.decrypt(ct)).isEqualTo("4111111111111111");
  }

  @Test
  void emptyAndUnicode() {
    assertThat(aes.decrypt(aes.encrypt(""))).isEmpty();
    String unicode = "πάντα ῥεῖ — 日本語";
    assertThat(aes.decrypt(aes.encrypt(unicode))).isEqualTo(unicode);
  }

  @Test
  void nullPlaintextRejected() {
    assertThatThrownBy(() -> aes.encrypt(null)).isInstanceOf(CryptoException.class);
  }

  @Test
  void largePayload() {
    String big = "x".repeat(200_000);
    assertThat(aes.decrypt(aes.encrypt(big))).isEqualTo(big);
  }

  @Test
  void binaryViaUtf8String() {
    String binaryish =
        new String(new byte[] {0, 1, 2, 127, (byte) 0xff}, StandardCharsets.ISO_8859_1);
    // Use encryptBytes path for true binary
    var key = keys.requireKey("v2");
    byte[] raw = new byte[] {0, 1, 2, 127, (byte) 0xff};
    byte[] blob = aes.encryptBytes(key, raw);
    assertThat(aes.decryptBytes(key, blob)).isEqualTo(raw);
    assertThat(binaryish).isNotNull();
  }

  @Test
  void tamperedCiphertextFailsAuth() {
    String ct = aes.encrypt("secret");
    String[] parts = ct.split("\\|", 3);
    byte[] raw = java.util.Base64.getUrlDecoder().decode(parts[2]);
    raw[raw.length - 1] ^= 0x01;
    String tampered =
        parts[0]
            + "|"
            + parts[1]
            + "|"
            + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    assertThatThrownBy(() -> aes.decrypt(tampered)).isInstanceOf(CryptoException.class);
  }

  @Test
  void wrongKeyFails() {
    String ct = aes.encrypt("secret");
    // Force decrypt with wrong key by rewriting keyId to v1 (different key material)
    String[] parts = ct.split("\\|", 3);
    String asV1 = "v1|" + parts[1] + "|" + parts[2];
    assertThatThrownBy(() -> aes.decrypt(asV1)).isInstanceOf(CryptoException.class);
  }

  @Test
  void reencryptUsesActiveKey() {
    CryptoProperties props = new CryptoProperties();
    props.setActiveKeyId("v1");
    Map<String, String> map = new LinkedHashMap<>();
    map.put("v1", "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
    map.put("v2", "YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODk=");
    props.setKeys(map);
    AesEncryptionService v1Aes = new AesEncryptionService(new ConfigAesKeyProvider(props));
    String oldCt = v1Aes.encrypt("rotate-me");
    assertThat(oldCt).startsWith("v1|");

    String rotated = aes.reencrypt(oldCt);
    assertThat(rotated).startsWith("v2|");
    assertThat(aes.decrypt(rotated)).isEqualTo("rotate-me");
  }

  @Test
  void concurrentEncrypt() throws Exception {
    int n = 32;
    ExecutorService pool = Executors.newFixedThreadPool(8);
    CountDownLatch ready = new CountDownLatch(n);
    CountDownLatch start = new CountDownLatch(1);
    CountDownLatch done = new CountDownLatch(n);
    AtomicInteger ok = new AtomicInteger();
    for (int i = 0; i < n; i++) {
      final int idx = i;
      pool.submit(
          () -> {
            ready.countDown();
            try {
              start.await();
              String ct = aes.encrypt("payload-" + idx);
              if (("payload-" + idx).equals(aes.decrypt(ct))) {
                ok.incrementAndGet();
              }
            } catch (Exception ignored) {
              // counted as failure via ok
            } finally {
              done.countDown();
            }
          });
    }
    ready.await(5, TimeUnit.SECONDS);
    start.countDown();
    assertThat(done.await(30, TimeUnit.SECONDS)).isTrue();
    pool.shutdownNow();
    assertThat(ok.get()).isEqualTo(n);
  }
}
