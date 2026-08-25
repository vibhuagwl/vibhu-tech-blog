package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.AiChatRequest;
import com.vibhu.aifp.common.AiContext;
import com.vibhu.aifp.common.Intent;
import com.vibhu.aifp.common.UserContext;
import com.vibhu.aifp.rag.RagService;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

@Component
public class ContextBuilder {

  private static final Pattern PAYMENT_ID = Pattern.compile("(PAY-\\d+)", Pattern.CASE_INSENSITIVE);
  private static final Pattern CUSTOMER_ID = Pattern.compile("(CUST-\\d+)", Pattern.CASE_INSENSITIVE);

  private final RagService ragService;
  private final ConversationMemory conversationMemory;

  public ContextBuilder(RagService ragService, ConversationMemory conversationMemory) {
    this.ragService = ragService;
    this.conversationMemory = conversationMemory;
  }

  public AiContext build(AiChatRequest request, Intent intent, UserContext user, List<String> allowedTools) {
    Map<String, String> entities = extractEntities(request.message());
    Map<String, String> filters = new HashMap<>();
    if (entities.containsKey("bank")) {
      filters.put("category", "runbook");
    }
    List<Document> docs = ragService.retrieve(request.message(), filters.isEmpty() ? null : filters);
    List<String> docIds =
        docs.stream()
            .map(d -> String.valueOf(d.getMetadata().getOrDefault("docId", d.getId())))
            .collect(Collectors.toList());
    String memorySummary = conversationMemory.summary(request.conversationId());
    return new AiContext(intent, docIds, entities, memorySummary, allowedTools);
  }

  private Map<String, String> extractEntities(String message) {
    Map<String, String> entities = new HashMap<>();
    Matcher pay = PAYMENT_ID.matcher(message);
    if (pay.find()) {
      entities.put("paymentId", pay.group(1).toUpperCase(Locale.ROOT));
    }
    Matcher cust = CUSTOMER_ID.matcher(message);
    if (cust.find()) {
      entities.put("customerId", cust.group(1).toUpperCase(Locale.ROOT));
    }
  if (message.toUpperCase(Locale.ROOT).contains("HSBC")) {
      entities.put("bank", "HSBC");
    }
    if (message.toUpperCase(Locale.ROOT).contains("BANK_TIMEOUT")) {
      entities.put("failureCode", "BANK_TIMEOUT");
    }
    return entities;
  }
}
