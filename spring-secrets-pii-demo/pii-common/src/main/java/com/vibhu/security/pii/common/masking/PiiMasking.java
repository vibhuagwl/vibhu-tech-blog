package com.vibhu.security.pii.common.masking;

public final class PiiMasking {

    private PiiMasking() {
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at + 1);
        String prefix = local.length() <= 1 ? "*" : local.charAt(0) + "***";
        return prefix + "@" + domain;
    }

    public static String maskSsn(String ssn) {
        if (ssn == null || ssn.length() < 4) {
            return "***-**-****";
        }
        String digits = ssn.replaceAll("\\D", "");
        if (digits.length() < 4) {
            return "***-**-****";
        }
        return "***-**-" + digits.substring(digits.length() - 4);
    }

    public static String maskPanLast4(String last4) {
        if (last4 == null || last4.isBlank()) {
            return "****";
        }
        return "****" + last4.trim();
    }
}
