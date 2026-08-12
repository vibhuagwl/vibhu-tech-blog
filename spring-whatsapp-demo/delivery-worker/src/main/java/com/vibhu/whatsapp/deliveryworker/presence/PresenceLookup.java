package com.vibhu.whatsapp.deliveryworker.presence;

import com.vibhu.whatsapp.common.dto.PresenceView;

public interface PresenceLookup {
    PresenceView find(String userId);
}
