package com.vibhu.security.pii.crypto;

import com.vibhu.security.pii.secrets.SecretProvider;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class EncryptionKeyHolder {

    private final SecretProvider secrets;
    private AesGcmCipher cipher;

    public EncryptionKeyHolder(SecretProvider secrets) {
        this.secrets = secrets;
    }

    @PostConstruct
    void init() {
        String base64Key = secrets.require("PII_ENCRYPTION_KEY");
        this.cipher = AesGcmCipher.fromBase64Key(base64Key);
    }

    public AesGcmCipher cipher() {
        return cipher;
    }
}
