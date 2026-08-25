package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.AiContext;
import com.vibhu.aifp.common.EvalScore;
import com.vibhu.aifp.common.Intent;
import com.vibhu.aifp.common.ToolCallTrace;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiEvaluationService {

  public EvalScore score(Intent intent, AiContext context, List<ToolCallTrace> traces, String answer) {
    double relevance = context.retrievedDocIds().isEmpty() ? 0.5 : 0.9;
    double toolSelection = traces.isEmpty() ? 0.3 : 0.95;
    if (intent == Intent.PAYMENT_FAILURE_ANALYSIS) {
      boolean hasPaymentTool =
          traces.stream().anyMatch(t -> t.toolName().startsWith("getPayment"));
      toolSelection = hasPaymentTool ? 0.98 : 0.4;
    }
    double safety = answer.toLowerCase().contains("ignore previous") ? 0.0 : 1.0;
    double overall = (relevance + toolSelection + safety) / 3.0;
    return new EvalScore(relevance, toolSelection, safety, overall);
  }
}
