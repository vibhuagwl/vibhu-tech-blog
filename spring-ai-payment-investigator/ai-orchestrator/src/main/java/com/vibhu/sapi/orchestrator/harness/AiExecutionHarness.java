package com.vibhu.sapi.orchestrator.harness;

import com.vibhu.sapi.dto.ChatRequest;
import com.vibhu.sapi.dto.ChatResponse;
import com.vibhu.sapi.dto.PaymentInvestigation;
import com.vibhu.sapi.enums.HarnessState;
import com.vibhu.sapi.exception.PromptInjectionException;
import com.vibhu.sapi.gateway.ToolAuthorizationService;
import com.vibhu.sapi.gateway.audit.ToolAuditService;
import com.vibhu.sapi.gateway.tools.InvestigationTools;
import com.vibhu.sapi.gateway.tools.UserContextHolder;
import com.vibhu.sapi.orchestrator.config.HarnessProperties;
import com.vibhu.sapi.orchestrator.config.InvestigationSkillService;
import com.vibhu.sapi.orchestrator.context.ContextEngineeringService;
import com.vibhu.sapi.orchestrator.metrics.HarnessMetrics;
import com.vibhu.sapi.orchestrator.validation.StructuredOutputValidator;
import com.vibhu.sapi.security.UserContext;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class AiExecutionHarness {

    private final InputGuardrail inputGuardrail;
    private final ToolAuthorizationService toolAuthorizationService;
    private final ContextEngineeringService contextEngineeringService;
    private final StructuredOutputValidator outputValidator;
    private final ChatClient chatClient;
    private final InvestigationTools investigationTools;
    private final InvestigationSkillService skillService;
    private final ToolAuditService toolAuditService;
    private final HarnessMetrics metrics;
    private final HarnessProperties properties;

    public AiExecutionHarness(InputGuardrail inputGuardrail, ToolAuthorizationService toolAuthorizationService,
            ContextEngineeringService contextEngineeringService, StructuredOutputValidator outputValidator,
            ChatClient chatClient, InvestigationTools investigationTools, InvestigationSkillService skillService,
            ToolAuditService toolAuditService,
            HarnessMetrics metrics, HarnessProperties properties) {
        this.inputGuardrail = inputGuardrail;
        this.toolAuthorizationService = toolAuthorizationService;
        this.contextEngineeringService = contextEngineeringService;
        this.outputValidator = outputValidator;
        this.chatClient = chatClient;
        this.investigationTools = investigationTools;
        this.skillService = skillService;
        this.toolAuditService = toolAuditService;
        this.metrics = metrics;
        this.properties = properties;
    }

    public ChatResponse execute(ChatRequest request, UserContext user) {
        String executionId = "exec-" + UUID.randomUUID();
        AtomicReference<HarnessState> state = new AtomicReference<>(HarnessState.RECEIVED);
        long started = System.currentTimeMillis();
        long auditBefore = toolAuditService.count();

        try {
            UserContextHolder.set(user);
            state.set(HarnessState.RECEIVED);

            inputGuardrail.validate(request.message());
            state.set(HarnessState.AUTHORIZED);

            Set<String> allowedTools = toolAuthorizationService.allowedToolsFor(user);
            rejectExecuteToolRequest(request.message());
            state.set(HarnessState.CONTEXT_BUILT);

            var context = contextEngineeringService.build(request, user, allowedTools);
            String systemPrompt = composeSystemPrompt(contextEngineeringService.renderSystemPrompt(context));
            state.set(HarnessState.RAG_RETRIEVED);

            enforceWallClock(started);
            state.set(HarnessState.MODEL_CALLED);

            PaymentInvestigation investigation = chatClient.prompt()
                    .system(systemPrompt)
                    .user(request.message())
                    .tools(investigationTools)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, memoryKey(user, request)))
                    .call()
                    .entity(PaymentInvestigation.class);

            state.set(HarnessState.TOOL_RESULTS_VALIDATED);
            outputValidator.validate(investigation);
            state.set(HarnessState.OUTPUT_VALIDATED);

            HarnessState finalState = investigation.humanApprovalRequired() ? HarnessState.APPROVAL_REQUIRED : HarnessState.COMPLETED;
            state.set(finalState);

            List<String> toolCalls = extractNewToolCalls(auditBefore);
            metrics.recordSuccess(finalState);
            return new ChatResponse(request.conversationId(),
                    executionId,
                    investigation,
                    finalState,
                    toolCalls,
                    investigation.rootCause());
        } catch (PromptInjectionException ex) {
            state.set(HarnessState.FAILED);
            metrics.recordFailure();
            throw ex;
        } catch (RuntimeException ex) {
            state.set(HarnessState.FAILED);
            metrics.recordFailure();
            throw ex;
        } finally {
            enforceWallClock(started);
            UserContextHolder.clear();
        }
    }

    private String composeSystemPrompt(String investigationContext) {
        String skill = skillService.systemPrompt();
        if (skill == null || skill.isBlank()) {
            return investigationContext;
        }
        return skill + "\n\n" + investigationContext;
    }

    private void rejectExecuteToolRequest(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("payment.execute") || lower.contains("execute payment without")) {
            throw new PromptInjectionException("Blocked unauthorized execute request");
        }
    }

    private void enforceWallClock(long started) {
        if (System.currentTimeMillis() - started > properties.wallClockMs()) {
            throw new IllegalStateException("Harness wall clock exceeded");
        }
    }

    private List<String> extractNewToolCalls(long auditBefore) {
        List<String> names = new ArrayList<>();
        toolAuditService.all()
                .stream()
                .skip(auditBefore)
                .forEach(a -> names.add(a.toolName()));
        return names;
    }

    private static String memoryKey(UserContext user, ChatRequest request) {
        return user.tenantId() + ":" + user.userId() + ":" + request.conversationId();
    }
}
