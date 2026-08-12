package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.messageservice.model.MessageRecord;

public record MessagePersistResult(MessageRecord message, boolean created) {
}
