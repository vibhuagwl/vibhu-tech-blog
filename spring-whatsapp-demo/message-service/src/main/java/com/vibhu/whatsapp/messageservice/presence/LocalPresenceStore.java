package com.vibhu.whatsapp.messageservice.presence;

import com.vibhu.whatsapp.common.dto.PresenceHeartbeatRequest;
import com.vibhu.whatsapp.common.dto.PresenceView;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!kafka & !redis")
public class LocalPresenceStore implements PresenceStore {
  private final ConcurrentMap<String, PresenceView> presenceByUserId = new ConcurrentHashMap<>();

  @Override
  public PresenceView heartbeat(PresenceHeartbeatRequest request) {
    PresenceView presence =
        new PresenceView(
            request.userId(), request.deviceId(), request.gatewayNode(), true, Instant.now());
    presenceByUserId.put(request.userId(), presence);
    return presence;
  }

  @Override
  public PresenceView find(String userId) {
    return presenceByUserId.getOrDefault(userId, new PresenceView(userId, null, null, false, null));
  }
}
