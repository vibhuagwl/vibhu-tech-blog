package com.vibhu.security.pii.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import com.vibhu.security.pii.secrets.SecretSanitizer;

/**
 * Logback converter — last line of defense if a developer logs a secret by mistake.
 */
public class PiiMaskingConverter extends MessageConverter {

    @Override
    public String convert(ILoggingEvent event) {
        return SecretSanitizer.redact(super.convert(event));
    }
}
