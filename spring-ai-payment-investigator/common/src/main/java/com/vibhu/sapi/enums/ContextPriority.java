package com.vibhu.sapi.enums;

public enum ContextPriority {
  SECURITY(100),
  PAYMENT_FACTS(90),
  TOOL_RESULTS(80),
  POLICY(70),
  MEMORY(60),
  CONVERSATION(50);

  private final int weight;

  ContextPriority(int weight) {
    this.weight = weight;
  }

  public int weight() {
    return weight;
  }
}
