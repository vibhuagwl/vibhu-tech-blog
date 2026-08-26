package com.vibhu.sapi.orchestrator.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
public class ScriptedChatModel implements ChatModel {

  private static final Pattern TXN = Pattern.compile("TXN-\\d+", Pattern.CASE_INSENSITIVE);
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public ChatResponse call(Prompt prompt) {
    List<Message> messages = prompt.getInstructions();
    boolean hasToolResponses = messages.stream().anyMatch(m -> m.getMessageType() == MessageType.TOOL);
    String userText = userQuestion(messages);

    if (hasToolResponses) {
      return finalInvestigation(userText, messages);
    }

    String lower = userText.toLowerCase(Locale.ROOT);
    if (lower.contains("txn-1001")
        || lower.contains("why did payment")
        || TXN.matcher(userText).find()) {
      String paymentId = extract(TXN, userText, "TXN-1001");
      return toolCalls(
          call("getPayment", "{\"paymentId\":\"" + paymentId + "\"}"),
          call("getPaymentHistory", "{\"paymentId\":\"" + paymentId + "\"}"),
          call("getBankResponse", "{\"paymentId\":\"" + paymentId + "\"}"),
          call("getPaymentRetryHistory", "{\"paymentId\":\"" + paymentId + "\"}"),
          call("searchPaymentPolicy", "{\"query\":\"BEN-001 beneficiary invalid retry policy\"}"));
    }

    return text("{\"error\":\"No investigation scenario matched\"}");
  }

  private ChatResponse finalInvestigation(String userText, List<Message> messages) {
    try {
      String paymentId = extract(TXN, userText, "TXN-1001");
      JsonNode payment = toolJson(messages, "getPayment");
      JsonNode bank = toolJson(messages, "getBankResponse");
      JsonNode retries = toolJson(messages, "getPaymentRetryHistory");
      String policy = toolText(messages, "searchPaymentPolicy");

      String status = textOr(payment, "status", "FAILED");
      String failureCode = textOr(payment, "failureCode", textOr(bank, "businessCode", "BEN-001"));
      int retryCount = payment != null && payment.has("retryCount") ? payment.get("retryCount").asInt(3) : 3;
      String bankMessage = textOr(bank, "message", "Beneficiary account validation failed");

      String rootCause =
          "Payment "
              + paymentId
              + " failed with "
              + failureCode
              + ": "
              + bankMessage
              + " after "
              + retryCount
              + " retries";

      ObjectNode root = objectMapper.createObjectNode();
      root.put("paymentId", paymentId);
      root.put("status", status);
      root.put("rootCause", rootCause);
      root.put("confidence", "HIGH");
      root.put("humanApprovalRequired", retryCount >= 3);

      ArrayNode evidence = root.putArray("evidence");
      evidence.addObject().put("sourceType", "payment").put("sourceId", paymentId).put("summary", "status=" + status + " failureCode=" + failureCode).put("confidence", "HIGH");
      evidence.addObject().put("sourceType", "bank").put("sourceId", paymentId).put("summary", "businessCode=" + failureCode + " message=" + bankMessage).put("confidence", "HIGH");
      if (retries != null && retries.isArray()) {
        evidence.addObject().put("sourceType", "retry").put("sourceId", paymentId).put("summary", "retryAttempts=" + retries.size()).put("confidence", "HIGH");
      }
      if (policy != null && !policy.isBlank()) {
        evidence.addObject().put("sourceType", "policy").put("sourceId", "payment-retry-policy").put("summary", policy.substring(0, Math.min(120, policy.length()))).put("confidence", "MEDIUM");
      }

      ArrayNode actions = root.putArray("recommendedActions");
      actions.add("Ask customer to verify beneficiary account and IFSC — do not retry with same details");
      if (retryCount >= 3) {
        actions.add("Create investigation case — max retries exhausted per policy");
      }
      actions.add("Human approval required before payment.execute or payment.retry");

      return text(objectMapper.writeValueAsString(root));
    } catch (JsonProcessingException ex) {
      return text("{\"error\":\"" + ex.getMessage() + "\"}");
    }
  }

  private JsonNode toolJson(List<Message> messages, String toolName) {
    String raw = toolText(messages, toolName);
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readTree(raw);
    } catch (JsonProcessingException ex) {
      return null;
    }
  }

  private String toolText(List<Message> messages, String toolName) {
    for (Message message : messages) {
      if (message instanceof ToolResponseMessage tr) {
        for (var response : tr.getResponses()) {
          if (toolName.equals(response.name())) {
            return response.responseData();
          }
        }
      }
    }
    return null;
  }

  private static String textOr(JsonNode node, String field, String fallback) {
    if (node != null && node.has(field) && !node.get(field).isNull()) {
      return node.get(field).asText();
    }
    return fallback;
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

  private static String userQuestion(List<Message> messages) {
    StringBuilder all = new StringBuilder();
    for (Message message : messages) {
      if (message instanceof UserMessage um && um.getText() != null) {
        all.append(' ').append(um.getText());
      }
    }
    return all.toString();
  }

  private static String extract(Pattern pattern, String text, String fallback) {
    Matcher matcher = pattern.matcher(text);
    return matcher.find() ? matcher.group().toUpperCase(Locale.ROOT) : fallback;
  }
}
