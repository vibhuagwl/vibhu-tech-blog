package com.vibhu.security.pii;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.security.pii.secrets.SecretSanitizer;
import org.junit.jupiter.api.Test;

class SecretSanitizerTest {

    @Test
    void redactsBearerTokensAndPasswords() {
        String raw = "login failed password=SuperSecret123 Bearer eyJhbGciOiJIUzI1NiJ9.abc";
        String redacted = SecretSanitizer.redact(raw);
        assertThat(redacted).doesNotContain("SuperSecret123");
        assertThat(redacted).doesNotContain("eyJhbGciOiJIUzI1NiJ9");
        assertThat(redacted).contains("[REDACTED]");
    }

    @Test
    void redactsSsnInLogs() {
        assertThat(SecretSanitizer.redact("user ssn 123-45-6789")).contains("***-**-****");
    }
}
