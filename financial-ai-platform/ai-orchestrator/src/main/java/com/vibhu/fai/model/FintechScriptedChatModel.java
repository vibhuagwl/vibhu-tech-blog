package com.vibhu.fai.model;

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
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * INTERVIEW NOTES — ChatModel vs ChatClient
 * ============================================================
 * ChatModel = provider call abstraction (OpenAI / Ollama / this scripted model).
 * ChatClient = app fluent API (prompt, advisors, tools, entity()).
 * This scripted model lets the platform run WITHOUT an API key while still
 * exercising the ToolCallingAdvisor loop: model asks for tools → tools run →
 * model returns structured JSON.
 * Spring AI version: 1.1.8 APIs used (AssistantMessage.ToolCall record).
 * ============================================================
 */
@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "scripted", matchIfMissing = true)
public class FintechScriptedChatModel implements ChatModel {

  private static final Pattern TXN = Pattern.compile("TXN-\\d+", Pattern.CASE_INSENSITIVE);
  private static final Pattern PORT = Pattern.compile("PORT-\\d+", Pattern.CASE_INSENSITIVE);
  @Override
  public ChatResponse call(Prompt prompt) {
    List<Message> messages = prompt.getInstructions();
    boolean hasToolResponses =
        messages.stream().anyMatch(m -> m.getMessageType() == MessageType.TOOL);
    String userText = lastUser(messages);

    if (hasToolResponses) {
      return finalAnswer(userText, messages);
    }

    if (userText.toLowerCase().contains("reverse")) {
      String txn = extract(TXN, userText, "TXN-1001");
      return toolCalls(
          call("getPayment", "{\"transactionId\":\"" + txn + "\"}"),
          call("checkReversalEligibility", "{\"transactionId\":\"" + txn + "\"}"),
          call(
              "proposeReversal",
              "{\"transactionId\":\"" + txn + "\",\"reason\":\"Customer requested reversal\"}"));
    }

    if (userText.toLowerCase().contains("portfolio")
        || userText.toLowerCase().contains("pnl")
        || userText.toLowerCase().contains("p&l")) {
      String port = extract(PORT, userText, "PORT-100");
      return toolCalls(
          call("getPositions", "{\"portfolioId\":\"" + port + "\"}"),
          call("calculatePnL", "{\"portfolioId\":\"" + port + "\"}"),
          call("calculateRisk", "{\"portfolioId\":\"" + port + "\"}"));
    }

    // Default: payment investigation
    String txn = extract(TXN, userText, "TXN-1001");
    return toolCalls(
        call("getPayment", "{\"transactionId\":\"" + txn + "\"}"),
        call("getBankResponse", "{\"transactionId\":\"" + txn + "\"}"),
        call(
            "searchCompliancePolicy",
            "{\"query\":\"payment failure bank response AC04 reversal policy\"}"),
        call(
            "analyzePaymentFailure",
            "{\"transactionId\":\"" + txn + "\",\"policyEvidenceId\":\"POL-PAYMENT-004\"}"));
  }

  private ChatResponse finalAnswer(String userText, List<Message> messages) {
    try {
      if (userText.toLowerCase().contains("reverse")) {
        String txn = extract(TXN, userText, "TXN-1001");
        String json =
            """
            {"transactionId":"%s","status":"FAILED","rootCause":"Reversal proposed pending human approval",
             "evidence":["PAYMENT-%s","POL-REVERSAL-001"],"recommendedAction":"Wait for approver",
             "approvalRequired":true}
            """
                .formatted(txn, txn);
        return text(json);
      }
      if (userText.toLowerCase().contains("portfolio")
          || userText.toLowerCase().contains("pnl")
          || userText.toLowerCase().contains("p&l")) {
        String port = extract(PORT, userText, "PORT-100");
        String json =
            """
            {"portfolioId":"%s","pnlAmount":-125000.00,"currency":"INR",
             "summary":"Portfolio unrealized P&L declined; largest drag from INFY and TCS (Java-calculated).",
             "topLossContributors":["INFY","TCS"],"evidence":["tool:calculatePnL","POL-RISK-020"],
             "riskLevel":"HIGH"}
            """
                .formatted(port);
        return text(json);
      }
      String txn = extract(TXN, userText, "TXN-1001");
      // Prefer analyzePaymentFailure tool payload if present
      String root = "Payment rejected by bank: account closed (AC04)";
      for (Message m : messages) {
        if (m instanceof ToolResponseMessage tr) {
          for (var r : tr.getResponses()) {
            if ("analyzePaymentFailure".equals(r.name()) && r.responseData() != null) {
              // keep deterministic explanation
              root = "Payment rejected by bank: account closed (AC04)";
            }
          }
        }
      }
      String json =
          """
          {"transactionId":"%s","status":"FAILED","rootCause":"%s",
           "evidence":["PAYMENT-%s","POL-PAYMENT-004"],
           "recommendedAction":"Ask customer to update beneficiary account; do not retry same account",
           "approvalRequired":false}
          """
              .formatted(txn, root, txn);
      return text(json);
    } catch (Exception e) {
      return text("{\"error\":\"" + e.getMessage() + "\"}");
    }
  }

  private static AssistantMessage.ToolCall call(String name, String args) {
    return new AssistantMessage.ToolCall(UUID.randomUUID().toString(), "function", name, args);
  }

  private static ChatResponse toolCalls(AssistantMessage.ToolCall... calls) {
    AssistantMessage msg =
        AssistantMessage.builder().content("").toolCalls(List.of(calls)).build();
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

  private static String extract(Pattern p, String text, String fallback) {
    Matcher m = p.matcher(text);
    return m.find() ? m.group().toUpperCase() : fallback;
  }
}
