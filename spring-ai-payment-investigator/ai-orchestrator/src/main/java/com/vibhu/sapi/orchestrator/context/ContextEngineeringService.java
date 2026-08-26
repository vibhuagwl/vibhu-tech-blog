package com.vibhu.sapi.orchestrator.context;

import com.vibhu.sapi.dto.ChatRequest;
import com.vibhu.sapi.dto.ContextItem;
import com.vibhu.sapi.dto.InvestigationContext;
import com.vibhu.sapi.enums.ContextPriority;
import com.vibhu.sapi.orchestrator.config.HarnessProperties;
import com.vibhu.sapi.rag.RagService;
import com.vibhu.sapi.security.UserContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

@Service
public class ContextEngineeringService {

  private static final Pattern TXN = Pattern.compile("TXN-\\d+", Pattern.CASE_INSENSITIVE);
  private static final Pattern PII_EMAIL = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
  private static final Pattern PII_PHONE = Pattern.compile("\\b\\d{10,12}\\b");

  private final RagService ragService;
  private final HarnessProperties properties;

  public ContextEngineeringService(RagService ragService, HarnessProperties properties) {
    this.ragService = ragService;
    this.properties = properties;
  }

  public InvestigationContext build(ChatRequest request, UserContext user, Set<String> allowedTools) {
    String paymentId = extractPaymentId(request.message());
    List<ContextItem> items = new ArrayList<>();

    items.add(
        item(
            "security",
            user.userId(),
            "Role=" + user.role() + " tenant=" + user.tenantId(),
            ContextPriority.SECURITY,
            user.tenantId()));

    if (paymentId != null) {
      items.add(
          item(
              "payment",
              paymentId,
              "Investigation target payment " + paymentId,
              ContextPriority.PAYMENT_FACTS,
              user.tenantId()));
    }

    List<Document> policyDocs = ragService.search(request.message(), 3);
    for (Document doc : policyDocs) {
      String source = String.valueOf(doc.getMetadata().getOrDefault("source", "policy"));
      items.add(
          item(
              "policy",
              source,
              filterPii(doc.getText()),
              ContextPriority.POLICY,
              user.tenantId()));
    }

    items.add(
        item(
            "conversation",
            request.conversationId(),
            filterPii(request.message()),
            ContextPriority.CONVERSATION,
            user.tenantId()));

    items.add(
        item(
            "memory",
            request.conversationId(),
            "Prior turns truncated for budget",
            ContextPriority.MEMORY,
            user.tenantId()));

    List<ContextItem> ranked = rankAndDedupe(items);
    List<ContextItem> budgeted = applyBudget(ranked, properties.contextBudgetChars());
    int used = budgeted.stream().mapToInt(i -> i.content().length()).sum();

    Map<String, String> entities = new HashMap<>();
    if (paymentId != null) {
      entities.put("paymentId", paymentId);
    }

    return new InvestigationContext(
        request.conversationId(),
        user.tenantId(),
        user.userId(),
        paymentId,
        budgeted,
        entities,
        List.copyOf(allowedTools),
        properties.contextBudgetChars(),
        used);
  }

  public String renderSystemPrompt(InvestigationContext context) {
    StringBuilder sb = new StringBuilder();
    sb.append("Investigation context (priority ordered):\n");
    for (ContextItem item : context.items()) {
      sb.append("- [").append(item.sourceType()).append("] ").append(item.content()).append("\n");
    }
    sb.append("Allowed tools: ").append(context.allowedTools()).append("\n");
    sb.append("Entities: ").append(context.entities()).append("\n");
    return sb.toString();
  }

  private List<ContextItem> rankAndDedupe(List<ContextItem> items) {
    Map<String, ContextItem> deduped = new LinkedHashMap<>();
    items.stream()
        .sorted((a, b) -> Integer.compare(b.priority(), a.priority()))
        .forEach(i -> deduped.putIfAbsent(i.sourceType() + ":" + i.sourceId(), i));
    return new ArrayList<>(deduped.values());
  }

  private List<ContextItem> applyBudget(List<ContextItem> items, int budget) {
    List<ContextItem> result = new ArrayList<>();
    int used = 0;
    for (ContextItem item : items) {
      String content = item.content();
      if (used + content.length() > budget) {
        int remaining = budget - used;
        if (remaining <= 0) {
          break;
        }
        content = content.substring(0, Math.min(content.length(), remaining)) + "...";
      }
      result.add(
          new ContextItem(
              item.sourceType(),
              item.sourceId(),
              content,
              item.priority(),
              item.timestamp(),
              item.confidence(),
              item.tenantId()));
      used += content.length();
    }
    return result;
  }

  private static ContextItem item(
      String sourceType, String sourceId, String content, ContextPriority priority, String tenantId) {
    return new ContextItem(
        sourceType,
        sourceId,
        content,
        priority.weight(),
        Instant.now(),
        "HIGH",
        tenantId);
  }

  private static String extractPaymentId(String message) {
    if (message == null) {
      return null;
    }
    Matcher m = TXN.matcher(message);
    return m.find() ? m.group().toUpperCase(Locale.ROOT) : null;
  }

  static String filterPii(String text) {
    if (text == null) {
      return "";
    }
    String filtered = PII_EMAIL.matcher(text).replaceAll("[REDACTED_EMAIL]");
    return PII_PHONE.matcher(filtered).replaceAll("[REDACTED_PHONE]");
  }
}
