package com.vibhu.fai.advisor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
public class AuditAdvisor implements CallAdvisor {
  private static final Logger log = LoggerFactory.getLogger(AuditAdvisor.class);

  @Override
  public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
    long t0 = System.nanoTime();
    ChatClientResponse response = chain.nextCall(request);
    log.info("ai_call latencyMs={}", (System.nanoTime() - t0) / 1_000_000);
    return response;
  }

  @Override
  public String getName() {
    return "AuditAdvisor";
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 800;
  }
}
