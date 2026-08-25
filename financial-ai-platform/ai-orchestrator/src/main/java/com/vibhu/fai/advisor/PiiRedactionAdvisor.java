package com.vibhu.fai.advisor;

import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
public class PiiRedactionAdvisor implements CallAdvisor {

  @Override
  public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
    // Production: mask PAN/Aadhaar-like tokens before provider calls.
    return chain.nextCall(request);
  }

  @Override
  public String getName() {
    return "PiiRedactionAdvisor";
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE + 100;
  }
}
