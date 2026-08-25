package com.vibhu.fai.advisor;

import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

/** Runs first — reject empty/malicious prompts early. */
@Component
public class SecurityAdvisor implements CallAdvisor {

  @Override
  public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
    String user = request.prompt().getUserMessage() != null
        ? request.prompt().getUserMessage().getText()
        : "";
    if (user.toLowerCase().contains("ignore previous instructions")
        && user.toLowerCase().contains("transfer")) {
      throw new SecurityException("Prompt injection pattern blocked");
    }
    return chain.nextCall(request);
  }

  @Override
  public String getName() {
    return "SecurityAdvisor";
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }
}
