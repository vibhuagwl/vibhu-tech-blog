package com.vibhu.security.pii.common.secrets;

import java.util.regex.Pattern;

public final class SecretSanitizer {

    private static final Pattern BEARER = Pattern.compile("(?i)(Bearer\\s+)[A-Za-z0-9\\-._~+/]+=*");
    private static final Pattern PASSWORD_KV = Pattern.compile("(?i)(password|passwd|secret|api[_-]?key)(=|:)\\s*\\S+");
    private static final Pattern JDBC_PASSWORD = Pattern.compile("(?i)(password=)[^&\\s]+");
    private static final Pattern SSN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");

    private SecretSanitizer() {
    }

    public static String redact(String message) {
        if (message == null || message.isBlank()) {
            return message;
        }
        String out = message;
        out = BEARER.matcher(out).replaceAll("$1[REDACTED]");
        out = PASSWORD_KV.matcher(out).replaceAll("$1$2[REDACTED]");
        out = JDBC_PASSWORD.matcher(out).replaceAll("$1[REDACTED]");
        out = SSN.matcher(out).replaceAll("***-**-****");
        return out;
    }
}
