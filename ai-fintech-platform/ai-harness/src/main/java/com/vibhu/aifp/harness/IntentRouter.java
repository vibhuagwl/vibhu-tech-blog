package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.AiChatRequest;
import com.vibhu.aifp.common.Intent;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class IntentRouter {

  private static final Pattern PAYMENT_ID = Pattern.compile("PAY-\\d+", Pattern.CASE_INSENSITIVE);

  public Intent route(AiChatRequest request) {
    String text = request.message().toLowerCase(Locale.ROOT);
    if (text.contains("replay") || text.contains("kafka")) {
      return Intent.KAFKA_REPLAY;
    }
    if (text.contains("report") || text.contains("summary")) {
      return Intent.REPORT;
    }
    if (text.contains("retry") || text.contains("retry allowed")) {
      return Intent.RETRY_ADVICE;
    }
    if (text.contains("status") && PAYMENT_ID.matcher(request.message()).find()) {
      return Intent.PAYMENT_STATUS;
    }
    if (text.contains("fail") || text.contains("why") || PAYMENT_ID.matcher(request.message()).find()) {
      return Intent.PAYMENT_FAILURE_ANALYSIS;
    }
    return Intent.GENERAL;
  }
}
