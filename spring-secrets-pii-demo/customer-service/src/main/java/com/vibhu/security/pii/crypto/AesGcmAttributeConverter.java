package com.vibhu.security.pii.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/** JPA converter — transparent encrypt-on-write / decrypt-on-read for PII columns. */
@Converter
@Component
public class AesGcmAttributeConverter implements AttributeConverter<String, String> {

  private final EncryptionKeyHolder keyHolder;

  public AesGcmAttributeConverter(EncryptionKeyHolder keyHolder) {
    this.keyHolder = keyHolder;
  }

  @Override
  public String convertToDatabaseColumn(String attribute) {
    return keyHolder.cipher().encrypt(attribute);
  }

  @Override
  public String convertToEntityAttribute(String dbData) {
    return keyHolder.cipher().decrypt(dbData);
  }
}
