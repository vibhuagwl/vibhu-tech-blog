package com.vibhu.fai.audit;

import com.vibhu.fai.web.RequestAuthHolder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ToolAuditService {
  private final ToolAuditRepository repo;

  public ToolAuditService(ToolAuditRepository repo) {
    this.repo = repo;
  }

  public void record(String toolName, Map<String, ?> args, boolean success) {
    var auth = RequestAuthHolder.get();
    ToolAudit a = new ToolAudit();
    a.setTenantId(auth.tenantId());
    a.setUserId(auth.userId());
    a.setConversationId(RequestAuthHolder.conversationId());
    a.setToolName(toolName);
    a.setArgumentsHash(sha256(String.valueOf(args)));
    a.setSuccess(success);
    a.setCreatedAt(Instant.now());
    repo.save(a);
  }

  private static String sha256(String s) {
    try {
      byte[] dig = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(dig).substring(0, 16);
    } catch (Exception e) {
      return "hash-error";
    }
  }
}
