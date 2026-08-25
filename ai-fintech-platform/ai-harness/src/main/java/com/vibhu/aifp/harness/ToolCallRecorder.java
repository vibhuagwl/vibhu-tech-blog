package com.vibhu.aifp.harness;

import com.vibhu.aifp.common.ToolCallTrace;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Thread-local tool audit for the current AI request.
 * IMPLEMENTED — tools record here; AiHarness drains into the response.
 */
@Component
public class ToolCallRecorder {

  private static final ThreadLocal<List<ToolCallTrace>> CURRENT = ThreadLocal.withInitial(ArrayList::new);

  public void begin() {
    CURRENT.set(new ArrayList<>());
  }

  public void record(String toolName, String arguments, String result, long durationMs, boolean authorized) {
    CURRENT.get().add(new ToolCallTrace(toolName, arguments, result, durationMs, authorized));
  }

  public List<ToolCallTrace> drain() {
    List<ToolCallTrace> out = List.copyOf(CURRENT.get());
    CURRENT.remove();
    return out;
  }
}
