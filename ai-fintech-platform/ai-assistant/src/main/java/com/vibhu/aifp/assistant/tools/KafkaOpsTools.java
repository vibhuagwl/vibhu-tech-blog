package com.vibhu.aifp.assistant.tools;

import com.vibhu.aifp.assistant.security.UserContextHolder;
import com.vibhu.aifp.common.ApprovalRequiredException;
import com.vibhu.aifp.common.KafkaMessageRecord;
import com.vibhu.aifp.domain.ApprovalService;
import com.vibhu.aifp.domain.KafkaOpsService;
import com.vibhu.aifp.domain.ToolAuthorizationService;
import com.vibhu.aifp.harness.HumanApprovalGate;
import java.util.List;
import java.util.Map;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class KafkaOpsTools {

  private final KafkaOpsService kafkaOpsService;
  private final ToolAuthorizationService authorizationService;
  private final HumanApprovalGate approvalGate;
  private final ApprovalService approvalService;

  public KafkaOpsTools(
      KafkaOpsService kafkaOpsService,
      ToolAuthorizationService authorizationService,
      HumanApprovalGate approvalGate,
      ApprovalService approvalService) {
    this.kafkaOpsService = kafkaOpsService;
    this.authorizationService = authorizationService;
    this.approvalGate = approvalGate;
    this.approvalService = approvalService;
  }

  @Tool(description = "Find failed Kafka messages for payment key. Read-only.")
  public List<KafkaMessageRecord> findFailedMessage(String paymentId) {
    authorizationService.authorize(UserContextHolder.get(), "findFailedMessage");
    return kafkaOpsService.findFailedMessage(paymentId);
  }

  @Tool(description = "Get Kafka message details. Read-only.")
  public KafkaMessageRecord getMessageDetails(String messageId) {
    authorizationService.authorize(UserContextHolder.get(), "getMessageDetails");
    return kafkaOpsService.getMessageDetails(messageId);
  }

  @Tool(description = "Replay Kafka message — proposes unless approved.")
  public KafkaMessageRecord replayMessage(String messageId) {
    authorizationService.authorize(UserContextHolder.get(), "replayMessage");
    try {
      approvalGate.requireApprovalIfWrite(
          "replayMessage", Map.of("messageId", messageId), UserContextHolder.get());
      return kafkaOpsService.replayMessage(messageId, true);
    } catch (ApprovalRequiredException ex) {
      return approvalService.proposeReplay(messageId, UserContextHolder.get());
    }
  }
}
