package com.vibhu.aifp.assistant.model;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "scripted", matchIfMissing = true)
public class OpsScriptedChatModel implements ChatModel {

  private static final Pattern PAYMENT_ID = Pattern.compile("PAY-\\d+", Pattern.CASE_INSENSITIVE);

  @Override
  public ChatResponse call(Prompt prompt) {
    List<Message> messages = prompt.getInstructions();
    boolean hasToolResponses = messages.stream().anyMatch(m -> m.getMessageType() == MessageType.TOOL);
    String userText = lastUser(messages);

    if (hasToolResponses) {
      return finalAnswer(userText);
    }

    String lower = userText.toLowerCase();
    if (lower.contains("replay") || lower.contains("kafka")) {
      String msgId = lower.contains("msg-") ? extract(PAYMENT_ID, userText, "MSG-501") : "MSG-501";
      return toolCalls(
          call("findFailedMessage", "{\"paymentId\":\"PAY-123\"}"),
          call("getMessageDetails", "{\"messageId\":\"" + msgId + "\"}"),
          call("replayMessage", "{\"messageId\":\"" + msgId + "\"}"));
    }
    if (lower.contains("report") || lower.contains("summary")) {
      return toolCalls(
          call("getDailyFailureSummary", "{\"date\":null}"),
          call("generatePaymentReport", "{\"customerId\":\"CUST-100\"}"));
    }
    if (lower.contains("retry")) {
      return toolCalls(
          call("getPayment", "{\"paymentId\":\"PAY-123\"}"),
          call("getPaymentFailureReason", "{\"paymentId\":\"PAY-123\"}"));
    }
    if (lower.contains("status")) {
      return toolCalls(call("getPaymentStatus", "{\"paymentId\":\"PAY-123\"}"));
    }

    String paymentId = extract(PAYMENT_ID, userText, "PAY-123");
    return toolCalls(
        call("getPayment", "{\"paymentId\":\"" + paymentId + "\"}"),
        call("getPaymentFailureReason", "{\"paymentId\":\"" + paymentId + "\"}"));
  }

  private ChatResponse finalAnswer(String userText) {
    String lower = userText.toLowerCase();
    if (lower.contains("replay") || lower.contains("kafka")) {
      return text(
          """
          {"messageId":"MSG-501","status":"REPLAY_PROPOSED","approvalRequired":true,
           "evidence":["findFailedMessage","getMessageDetails"],
           "recommendedAction":"Obtain OPS approval before replay"}
          """);
    }
    if (lower.contains("report") || lower.contains("summary")) {
      return text(
          """
          {"summary":"1 failed HSBC payment (BANK_TIMEOUT)","failedCount":1,
           "evidence":["getDailyFailureSummary","generatePaymentReport"]}
          """);
    }
    if (lower.contains("retry")) {
      return text(
          """
          {"paymentId":"PAY-123","retryAllowed":true,"failureCode":"BANK_TIMEOUT",
           "recommendedAction":"Retry with exponential backoff per payment-retry-policy",
           "evidence":["getPayment","getPaymentFailureReason"],"approvalRequired":false}
          """);
    }
    if (lower.contains("status")) {
      return text("{\"paymentId\":\"PAY-123\",\"status\":\"FAILED\",\"bank\":\"HSBC\"}");
    }
    return text(
        """
        {"paymentId":"PAY-123","status":"FAILED","rootCause":"HSBC gateway did not respond within SLA (BANK_TIMEOUT)",
         "failureCode":"BANK_TIMEOUT","bank":"HSBC",
         "evidence":["getPayment","getPaymentFailureReason","payment-retry-policy"],
         "recommendedAction":"Safe to retry up to 3 times after HSBC recovery",
         "approvalRequired":false}
        """);
  }

  private static AssistantMessage.ToolCall call(String name, String args) {
    return new AssistantMessage.ToolCall(UUID.randomUUID().toString(), "function", name, args);
  }

  private static ChatResponse toolCalls(AssistantMessage.ToolCall... calls) {
    AssistantMessage msg = AssistantMessage.builder().content("").toolCalls(List.of(calls)).build();
    return new ChatResponse(List.of(new Generation(msg)));
  }

  private static ChatResponse text(String content) {
    return new ChatResponse(List.of(new Generation(new AssistantMessage(content))));
  }

  private static String lastUser(List<Message> messages) {
    for (int i = messages.size() - 1; i >= 0; i--) {
      if (messages.get(i) instanceof UserMessage um) {
        return um.getText();
      }
    }
    return "";
  }

  private static String extract(Pattern pattern, String text, String fallback) {
    Matcher matcher = pattern.matcher(text);
    return matcher.find() ? matcher.group().toUpperCase() : fallback;
  }
}
