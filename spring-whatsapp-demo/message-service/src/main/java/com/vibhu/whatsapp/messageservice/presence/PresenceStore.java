package com.vibhu.whatsapp.messageservice.presence;

import com.vibhu.whatsapp.common.dto.PresenceHeartbeatRequest;
import com.vibhu.whatsapp.common.dto.PresenceView;

public interface PresenceStore {
  PresenceView heartbeat(PresenceHeartbeatRequest request);

  PresenceView find(String userId);
}
