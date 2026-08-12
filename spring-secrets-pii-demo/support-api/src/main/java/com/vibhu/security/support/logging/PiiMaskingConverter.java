package com.vibhu.security.support.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import com.vibhu.security.pii.common.secrets.SecretSanitizer;

public class PiiMaskingConverter extends MessageConverter {

    @Override
    public String convert(ILoggingEvent event) {
        return SecretSanitizer.redact(super.convert(event));
    }
}
