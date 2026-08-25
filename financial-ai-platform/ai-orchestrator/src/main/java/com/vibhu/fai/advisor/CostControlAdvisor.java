package com.vibhu.fai.advisor;

import java.util.concurrent.atomic.AtomicLong;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
public class CostControlAdvisor implements CallAdvisor {
  private final AtomicLong calls = new AtomicLong();

  @Override
  public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
    long n = calls.incrementAndGet();
    if (n > 10_000) {
      throw new IllegalStateException("Tenant AI budget exceeded (demo guard)");
    }
    return chain.nextCall(request);
  }

  public long calls() {
    return calls.get();
  }

  @Override
  public String getName() {
    return "CostControlAdvisor";
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 900;
  }
}
