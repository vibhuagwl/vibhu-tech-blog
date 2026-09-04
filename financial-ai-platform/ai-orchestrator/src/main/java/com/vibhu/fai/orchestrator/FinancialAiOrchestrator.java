package com.vibhu.fai.orchestrator;

import com.vibhu.fai.common.dto.ChatApiResponse;
import com.vibhu.fai.common.dto.ChatRequest;
import com.vibhu.fai.common.dto.FinancialAnalysis;
import com.vibhu.fai.common.dto.PaymentInvestigation;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.obs.AiMetrics;
import com.vibhu.fai.tools.*;
import com.vibhu.fai.web.RequestAuthHolder;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class FinancialAiOrchestrator {

    private final ChatClient chatClient;
    private final PaymentTools paymentTools;
    private final PortfolioTools portfolioTools;
    private final MarketTools marketTools;
    private final ComplianceTools complianceTools;
    private final ApprovalTools approvalTools;
    private final PaymentInvestigationValidator paymentValidator;
    private final AiMetrics metrics;

    public FinancialAiOrchestrator(ChatClient chatClient, PaymentTools paymentTools, PortfolioTools portfolioTools,
            MarketTools marketTools, ComplianceTools complianceTools, ApprovalTools approvalTools,
            PaymentInvestigationValidator paymentValidator, AiMetrics metrics) {
        this.chatClient = chatClient;
        this.paymentTools = paymentTools;
        this.portfolioTools = portfolioTools;
        this.marketTools = marketTools;
        this.complianceTools = complianceTools;
        this.approvalTools = approvalTools;
        this.paymentValidator = paymentValidator;
        this.metrics = metrics;
    }

    public ChatApiResponse chat(ChatRequest request, AuthContext auth) {
        String intent = intentOf(request.question());
        return metrics.recordChat(intent, () -> chatInternal(request, auth, intent));
    }

    private ChatApiResponse chatInternal(ChatRequest request, AuthContext auth, String intent) {
        String executionId = "exec_" + UUID.randomUUID();
        RequestAuthHolder.set(auth, request.conversationId());
        try {
            if ("portfolio".equals(intent)) {
                FinancialAnalysis analysis = chatClient.prompt()
                        .user(request.question())
                        .tools(portfolioTools, marketTools, complianceTools)
                        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
                        .call()
                        .entity(FinancialAnalysis.class);
                return new ChatApiResponse(request.conversationId(),
                        executionId,
                        analysis,
                        List.of("portfolio-tools"),
                        "structured");
            }
            if ("reversal".equals(intent)) {
                PaymentInvestigation inv = chatClient.prompt()
                        .user(request.question())
                        .tools(paymentTools, complianceTools, approvalTools)
                        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
                        .call()
                        .entity(PaymentInvestigation.class);
                paymentValidator.validate(inv);
                return new ChatApiResponse(request.conversationId(),
                        executionId,
                        inv,
                        List.of("approval-tools"),
                        "structured");
            }
            PaymentInvestigation inv = chatClient.prompt()
                    .user(request.question())
                    .tools(paymentTools, complianceTools)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(auth, request)))
                    .call()
                    .entity(PaymentInvestigation.class);
            paymentValidator.validate(inv);
            return new ChatApiResponse(request.conversationId(),
                    executionId,
                    inv,
                    List.of("payment-tools"),
                    "structured");
        } finally {
            RequestAuthHolder.clear();
        }
    }

    static String intentOf(String question) {
        String q = question.toLowerCase();
        if (q.contains("portfolio") || q.contains("pnl") || q.contains("p&l")) {
            return "portfolio";
        }
        if (q.contains("reverse")) {
            return "reversal";
        }
        return "investigation";
    }

    private static String memoryKey(AuthContext auth, ChatRequest request) {
        return auth.tenantId() + ":" + auth.userId() + ":" + request.conversationId();
    }
}
