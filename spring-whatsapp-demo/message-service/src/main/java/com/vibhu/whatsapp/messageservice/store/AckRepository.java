package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.common.dto.AckType;
import com.vibhu.whatsapp.messageservice.model.AckRecord;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Repository;

@Repository
public class AckRepository {
  private final ConcurrentMap<AckKey, AckRecord> acksByKey = new ConcurrentHashMap<>();

  public AckRecord save(String serverMsgId, String userId, String deviceId, AckType type) {
    AckRecord ack = new AckRecord(serverMsgId, userId, deviceId, type, Instant.now());
    acksByKey.put(new AckKey(serverMsgId, userId, deviceId, type), ack);
    return ack;
  }

  private record AckKey(String serverMsgId, String userId, String deviceId, AckType type) {}
}
