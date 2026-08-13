package com.vibhu.crypto.crypto;

import javax.crypto.SecretKey;

/** Resolves AES keys by id. Prod: Secrets Manager / KMS DEK unwrap. */
public interface AesKeyProvider {
  String activeKeyId();

  SecretKey requireKey(String keyId);
}
