package com.vibhu.aifp.assistant.service;

import com.vibhu.aifp.assistant.tools.CustomerOpsTools;
import com.vibhu.aifp.assistant.tools.KafkaOpsTools;
import com.vibhu.aifp.assistant.tools.PaymentOpsTools;
import com.vibhu.aifp.assistant.tools.ReportingOpsTools;
import com.vibhu.aifp.common.AiChatRequest;
import com.vibhu.aifp.common.AiChatResponse;
import com.vibhu.aifp.common.Intent;
import com.vibhu.aifp.common.PaymentInvestigation;
import com.vibhu.aifp.common.UserContext;
import com.vibhu.aifp.harness.AiHarness;
import com.vibhu.aifp.harness.PreparedAiCall;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiChatService {

  private final AiHarness aiHarness;
  private final ChatClient chatClient;
  private final PaymentOpsTools paymentOpsTools;
  private final CustomerOpsTools customerOpsTools;
  private final KafkaOpsTools kafkaOpsTools;
  private final ReportingOpsTools reportingOpsTools;

  public AiChatService(
      AiHarness aiHarness,
      ChatClient chatClient,
      PaymentOpsTools paymentOpsTools,
      CustomerOpsTools customerOpsTools,
      KafkaOpsTools kafkaOpsTools,
      ReportingOpsTools reportingOpsTools) {
    this.aiHarness = aiHarness;
    this.chatClient = chatClient;
    this.paymentOpsTools = paymentOpsTools;
    this.customerOpsTools = customerOpsTools;
    this.kafkaOpsTools = kafkaOpsTools;
    this.reportingOpsTools = reportingOpsTools;
  }

  public AiChatResponse chat(AiChatRequest request, UserContext user) {
    PreparedAiCall prepared = aiHarness.prepare(request, user);
    Object[] tools = resolveTools(prepared.intent());
    if (prepared.intent() == Intent.PAYMENT_FAILURE_ANALYSIS
        || prepared.intent() == Intent.RETRY_ADVICE
        || prepared.intent() == Intent.PAYMENT_STATUS) {
      return aiHarness.executeWith(
          prepared, chatClient, tools, spec -> spec.entity(PaymentInvestigation.class));
    }
    return aiHarness.executeWith(prepared, chatClient, tools, spec -> spec.content());
  }

  private Object[] resolveTools(Intent intent) {
    return switch (intent) {
      case KAFKA_REPLAY -> new Object[] {kafkaOpsTools, paymentOpsTools};
      case REPORT -> new Object[] {reportingOpsTools, paymentOpsTools};
      case PAYMENT_FAILURE_ANALYSIS, PAYMENT_STATUS, RETRY_ADVICE ->
          new Object[] {paymentOpsTools, customerOpsTools, reportingOpsTools};
      default ->
          new Object[] {
            paymentOpsTools, customerOpsTools, kafkaOpsTools, reportingOpsTools
          };
    };
  }
}
