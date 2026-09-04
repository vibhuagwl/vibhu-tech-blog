package com.vibhu.fai.advisor;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
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
    private final MeterRegistry registry;

    public AuditAdvisor(MeterRegistry registry) {
        this.registry = registry;
    }

  @Override
  public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
      Timer.Sample sample = Timer.start(registry);
    ChatClientResponse response = chain.nextCall(request);
      long nanos = sample.stop(Timer.builder("fai.model.call.duration")
              .register(registry));
      log.info("ai_call latencyMs={}", nanos / 1_000_000);
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
