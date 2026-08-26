package com.vibhu.sapi.gateway.tools;

import com.vibhu.sapi.dto.BankResponseView;
import com.vibhu.sapi.dto.CustomerPaymentProfile;
import com.vibhu.sapi.dto.InvestigationCaseView;
import com.vibhu.sapi.dto.KafkaEventView;
import com.vibhu.sapi.dto.PaymentHistoryEntry;
import com.vibhu.sapi.dto.PaymentView;
import com.vibhu.sapi.dto.RetryHistoryEntry;
import com.vibhu.sapi.exception.ApprovalRequiredException;
import com.vibhu.sapi.gateway.ToolGateway;
import com.vibhu.sapi.payment.service.PaymentApplicationService;
import com.vibhu.sapi.rag.RagService;
import com.vibhu.sapi.security.UserContext;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class InvestigationTools {

  private final ToolGateway toolGateway;
  private final PaymentApplicationService paymentService;
  private final RagService ragService;

  public InvestigationTools(
      ToolGateway toolGateway,
      PaymentApplicationService paymentService,
      RagService ragService) {
    this.toolGateway = toolGateway;
    this.paymentService = paymentService;
    this.ragService = ragService;
  }

  @Tool(description = "Get payment details by TXN id. Read-only.")
  public PaymentView getPayment(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getPayment",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getPayment(paymentId));
  }

  @Tool(description = "Get payment event timeline. Read-only.")
  public List<PaymentHistoryEntry> getPaymentHistory(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getPaymentHistory",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getPaymentHistory(paymentId));
  }

  @Tool(description = "Get bank response for payment. Read-only.")
  public BankResponseView getBankResponse(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getBankResponse",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getBankResponse(paymentId));
  }

  @Tool(description = "Get retry attempt history. Read-only.")
  public List<RetryHistoryEntry> getPaymentRetryHistory(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getPaymentRetryHistory",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getPaymentRetryHistory(paymentId));
  }

  @Tool(description = "Get customer payment profile. Read-only.")
  public CustomerPaymentProfile getCustomerPaymentProfile(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getCustomerPaymentProfile",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getCustomerPaymentProfile(paymentId));
  }

  @Tool(description = "Get payment status. Read-only.")
  public String getPaymentStatus(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getPaymentStatus",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getPaymentStatus(paymentId));
  }

  @Tool(description = "Search payment policy documents. Read-only.")
  public String searchPaymentPolicy(String query) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "searchPaymentPolicy",
        "{\"query\":\"" + query + "\"}",
        () -> {
          List<Document> docs = ragService.search(query, 3);
          return docs.stream()
              .map(d -> d.getMetadata().getOrDefault("source", "doc") + ": " + truncate(d.getText()))
              .collect(Collectors.joining("\n---\n"));
        });
  }

  @Tool(description = "Get Kafka events related to payment. Read-only.")
  public List<KafkaEventView> getRelatedKafkaEvents(String paymentId) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "getRelatedKafkaEvents",
        "{\"paymentId\":\"" + paymentId + "\"}",
        () -> paymentService.getRelatedKafkaEvents(paymentId));
  }

  @Tool(description = "Create investigation case — requires human approval for write.")
  public InvestigationCaseView createInvestigationCase(String paymentId, String reason) {
    return toolGateway.invoke(
        UserContextHolder.get(),
        "createInvestigationCase",
        "{\"paymentId\":\"" + paymentId + "\",\"reason\":\"" + reason + "\"}",
        () -> paymentService.createInvestigationCase(paymentId, reason));
  }

  private static String truncate(String text) {
    if (text == null) {
      return "";
    }
    return text.length() > 400 ? text.substring(0, 400) + "..." : text;
  }
}
