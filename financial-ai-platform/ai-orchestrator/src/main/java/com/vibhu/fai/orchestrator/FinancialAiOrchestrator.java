package com.vibhu.fai.orchestrator;

import com.vibhu.fai.common.dto.ChatApiResponse;
import com.vibhu.fai.common.dto.ChatRequest;
import com.vibhu.fai.common.dto.FinancialAnalysis;
import com.vibhu.fai.common.dto.PaymentInvestigation;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.tools.ApprovalTools;
import com.vibhu.fai.tools.ComplianceTools;
import com.vibhu.fai.tools.MarketTools;
import com.vibhu.fai.tools.PaymentTools;
import com.vibhu.fai.tools.PortfolioTools;
import com.vibhu.fai.web.RequestAuthHolder;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

/**
 * ============================================================
 * INTERVIEW NOTES — SPRING AI = C T R M A S
 * ============================================================
 * C = ChatClient   T = Tools   R = RAG   M = Memory
 * A = Advisors/Agents   S = Structured Output
 *
 * Production flow:
 * AI orchestrates → Tools → Java business logic → DB/services
 *
 * AI = REASON + ORCHESTRATE + EXPLAIN
 * JAVA = CALCULATE + AUTHORIZE + EXECUTE + AUDIT
 * ============================================================
 */
@Service
public class FinancialAiOrchestrator {

  private final ChatClient chatClient;
  private final PaymentTools paymentTools;
  private final PortfolioTools portfolioTools;
  private final MarketTools marketTools;
  private final ComplianceTools complianceTools;
  private final ApprovalTools approvalTools;
  private final PaymentInvestigationValidator paymentValidator;
  private final List<String> lastTools = new ArrayList<>();

  public FinancialAiOrchestrator(
      ChatClient chatClient,
      PaymentTools paymentTools,
      PortfolioTools portfolioTools,
      MarketTools marketTools,
      ComplianceTools complianceTools,
      ApprovalTools approvalTools,
      PaymentInvestigationValidator paymentValidator) {
    this.chatClient = chatClient;
    this.paymentTools = paymentTools;
    this.portfolioTools = portfolioTools;
    this.marketTools = marketTools;
    this.complianceTools = complianceTools;
    this.approvalTools = approvalTools;
    this.paymentValidator = paymentValidator;
  }

  public ChatApiResponse chat(ChatRequest request, AuthContext auth) {
    String executionId = "exec_" + UUID.randomUUID();
    RequestAuthHolder.set(auth, request.conversationId());
    try {
      String q = request.question().toLowerCase();
      if (q.contains("portfolio") || q.contains("pnl") || q.contains("p&l")) {
        FinancialAnalysis analysis =
            chatClient
                .prompt()
                .user(request.question())
                .tools(portfolioTools, marketTools, complianceTools)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
                .call()
                .entity(FinancialAnalysis.class);
        return new ChatApiResponse(
            request.conversationId(), executionId, analysis, List.of("portfolio-tools"), "structured");
      }
      if (q.contains("reverse")) {
        PaymentInvestigation inv =
            chatClient
                .prompt()
                .user(request.question())
                .tools(paymentTools, complianceTools, approvalTools)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
                .call()
                .entity(PaymentInvestigation.class);
        paymentValidator.validate(inv);
        return new ChatApiResponse(
            request.conversationId(), executionId, inv, List.of("approval-tools"), "structured");
      }
      PaymentInvestigation inv =
          chatClient
              .prompt()
              .user(request.question())
              .tools(paymentTools, complianceTools)
              .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
              .call()
              .entity(PaymentInvestigation.class);
      paymentValidator.validate(inv);
      return new ChatApiResponse(
          request.conversationId(), executionId, inv, List.of("payment-tools"), "structured");
    } finally {
      RequestAuthHolder.clear();
    }
  }

  private static String memoryKey(AuthContext auth, ChatRequest request) {
    // INTERVIEW: conversationId alone is not enough in multi-tenant systems.
    // Production key: tenantId:userId:conversationId
    return auth.tenantId() + ":" + auth.userId() + ":" + request.conversationId();
  }
}
