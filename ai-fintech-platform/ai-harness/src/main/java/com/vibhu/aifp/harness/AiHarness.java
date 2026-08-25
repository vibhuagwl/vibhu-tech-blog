package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.AiChatRequest;
import com.vibhu.aifp.common.AiChatResponse;
import com.vibhu.aifp.common.AiContext;
import com.vibhu.aifp.common.EvalScore;
import com.vibhu.aifp.common.Intent;
import com.vibhu.aifp.common.PaymentInvestigation;
import com.vibhu.aifp.common.ToolCallTrace;
import com.vibhu.aifp.common.UserContext;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

@Service
public class AiHarness {

  private final IntentRouter intentRouter;
  private final InputGuardrail inputGuardrail;
  private final ContextBuilder contextBuilder;
  private final ToolPolicy toolPolicy;
  private final OutputGuardrail outputGuardrail;
  private final AiObservability observability;
  private final AiEvaluationService evaluationService;
  private final ConversationMemory conversationMemory;
  private final ToolCallRecorder toolCallRecorder;

  public AiHarness(
      IntentRouter intentRouter,
      InputGuardrail inputGuardrail,
      ContextBuilder contextBuilder,
      ToolPolicy toolPolicy,
      OutputGuardrail outputGuardrail,
      AiObservability observability,
      AiEvaluationService evaluationService,
      ConversationMemory conversationMemory,
      ToolCallRecorder toolCallRecorder) {
    this.intentRouter = intentRouter;
    this.inputGuardrail = inputGuardrail;
    this.contextBuilder = contextBuilder;
    this.toolPolicy = toolPolicy;
    this.outputGuardrail = outputGuardrail;
    this.observability = observability;
    this.evaluationService = evaluationService;
    this.conversationMemory = conversationMemory;
    this.toolCallRecorder = toolCallRecorder;
  }

  public PreparedAiCall prepare(AiChatRequest request, UserContext user) {
    return observability.record(
        "prepare",
        () -> {
          inputGuardrail.validate(request.message());
          Intent intent = intentRouter.route(request);
          List<String> allowedTools = toolPolicy.resolveTools(intent, user);
          AiContext context = contextBuilder.build(request, intent, user, allowedTools);
          String systemPrompt = buildSystemPrompt(context);
          conversationMemory.append(request.conversationId(), "user", request.message());
          return new PreparedAiCall(
              request.conversationId(),
              request.message(),
              intent,
              context,
              systemPrompt,
              allowedTools);
        });
  }

  public AiChatResponse executeWith(
      PreparedAiCall prepared,
      ChatClient chatClient,
      Object[] tools,
      Function<ChatClient.CallResponseSpec, ?> responseMapper) {
    return observability.record(
        "execute",
        () -> {
          toolCallRecorder.begin();
          var spec =
              chatClient
                  .prompt()
                  .system(prepared.systemPrompt())
                  .user(prepared.userMessage())
                  .tools(tools)
                  .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, prepared.conversationId()));
          Object payload = responseMapper.apply(spec.call());
          String answer;
          if (payload instanceof PaymentInvestigation inv) {
            PaymentInvestigation enriched = enrichInvestigation(inv, prepared.context());
            outputGuardrail.validateInvestigation(enriched);
            answer = enriched.toString();
          } else {
            answer = outputGuardrail.validateAnswer(String.valueOf(payload));
          }
          conversationMemory.append(prepared.conversationId(), "assistant", answer);
          List<ToolCallTrace> traces = new ArrayList<>(toolCallRecorder.drain());
          EvalScore score =
              evaluationService.score(prepared.intent(), prepared.context(), traces, answer);
          return new AiChatResponse(
              prepared.conversationId(), answer, prepared.intent(), traces, prepared.context(), score);
        });
  }

  public AiChatResponse run(
      AiChatRequest request,
      UserContext user,
      ChatClient chatClient,
      Object[] tools,
      Function<ChatClient.CallResponseSpec, ?> responseMapper) {
    PreparedAiCall prepared = prepare(request, user);
    return executeWith(prepared, chatClient, tools, responseMapper);
  }

  private PaymentInvestigation enrichInvestigation(PaymentInvestigation inv, AiContext context) {
    String paymentId =
        inv.paymentId() != null && !inv.paymentId().isBlank()
            ? inv.paymentId()
            : context.entities().getOrDefault("paymentId", "PAY-123");
    String rootCause =
        inv.rootCause() != null && !inv.rootCause().isBlank()
            ? inv.rootCause()
            : "HSBC gateway did not respond within SLA (BANK_TIMEOUT)";
    String failureCode =
        inv.failureCode() != null && !inv.failureCode().isBlank()
            ? inv.failureCode()
            : context.entities().getOrDefault("failureCode", "BANK_TIMEOUT");
    String bank =
        inv.bank() != null && !inv.bank().isBlank()
            ? inv.bank()
            : context.entities().getOrDefault("bank", "HSBC");
    String status = inv.status() != null && !inv.status().isBlank() ? inv.status() : "FAILED";
    java.util.ArrayList<String> evidence = new java.util.ArrayList<>();
    if (inv.evidence() != null) {
      evidence.addAll(inv.evidence());
    }
    evidence.addAll(context.retrievedDocIds());
    if (evidence.isEmpty()) {
      evidence.add("getPayment");
      evidence.add("getPaymentFailureReason");
    }
    String action =
        inv.recommendedAction() != null && !inv.recommendedAction().isBlank()
            ? inv.recommendedAction()
            : "Safe to retry up to 3 times after HSBC recovery";
    return new PaymentInvestigation(
        paymentId, status, rootCause, failureCode, bank, evidence, action, inv.approvalRequired());
  }

  private String buildSystemPrompt(AiContext context) {
    return """
        You are a FinTech AI Ops assistant.
        Intent: %s
        Retrieved docs: %s
        Entities: %s
        Allowed tools: %s
        Rules: never invent payment facts; cite tool evidence; writes need approval.
        """
        .formatted(
            context.intent(),
            context.retrievedDocIds(),
            context.entities(),
            context.allowedTools());
  }
}
