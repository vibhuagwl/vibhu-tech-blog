package com.vibhu.aifp.kafka.mcp;

import com.vibhu.aifp.common.KafkaMessageRecord;
import com.vibhu.aifp.domain.KafkaOpsService;
import java.util.List;
import org.springaicommunity.mcp.annotation.McpPrompt;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

@Component
public class KafkaMcpTools {

  private final KafkaOpsService kafkaOpsService;

  public KafkaMcpTools(KafkaOpsService kafkaOpsService) {
    this.kafkaOpsService = kafkaOpsService;
  }

  @McpTool(name = "findFailedMessage", description = "Find failed Kafka messages for a payment")
  public List<KafkaMessageRecord> findFailedMessage(
      @McpToolParam(description = "Payment id key", required = true) String paymentId) {
    return kafkaOpsService.findFailedMessage(paymentId);
  }

  @McpTool(name = "getMessageDetails", description = "Get Kafka message by id")
  public KafkaMessageRecord getMessageDetails(
      @McpToolParam(description = "Message id", required = true) String messageId) {
    return kafkaOpsService.getMessageDetails(messageId);
  }

  @McpTool(name = "replayMessage", description = "Replay message (proposed unless approved)")
  public KafkaMessageRecord replayMessage(
      @McpToolParam(description = "Message id", required = true) String messageId,
      @McpToolParam(description = "Approved flag", required = false) boolean approved) {
    return kafkaOpsService.replayMessage(messageId, approved);
  }

  @McpPrompt(name = "kafka-replay-checklist", description = "Replay approval checklist")
  public String replayChecklist() {
    return "Confirm HSBC recovery, verify PAY failure code, obtain OPS approval before replay.";
  }
}
