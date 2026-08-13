package com.vibhu.crypto.crypto;

import com.vibhu.crypto.exception.CryptoException;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/**
 * Transparent AES-GCM for JPA String fields. Searching this column with LIKE/equals
 * on plaintext will not work — use a separate HMAC lookup column.
 */
@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {
  private static EncryptionService encryption;

  public EncryptedStringConverter(EncryptionService encryptionService) {
    EncryptedStringConverter.encryption = encryptionService;
  }

  /** Required by JPA when instantiating converters without Spring. */
  public EncryptedStringConverter() {}

  @Override
  public String convertToDatabaseColumn(String attribute) {
    if (attribute == null) {
      return null;
    }
    return require().encrypt(attribute);
  }

  @Override
  public String convertToEntityAttribute(String dbData) {
    if (dbData == null) {
      return null;
    }
    return require().decrypt(dbData);
  }

  private static EncryptionService require() {
    if (encryption == null) {
      throw new CryptoException("EncryptedStringConverter not wired — EncryptionService missing");
    }
    return encryption;
  }
}
