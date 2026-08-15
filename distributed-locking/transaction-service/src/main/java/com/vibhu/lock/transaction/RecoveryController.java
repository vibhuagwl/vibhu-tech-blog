package com.vibhu.lock.transaction;

import com.vibhu.lock.transaction.TransactionDtos.TransactionView;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/recovery")
public class RecoveryController {
  private final RecoveryManager recoveryManager;

  public RecoveryController(RecoveryManager recoveryManager) {
    this.recoveryManager = recoveryManager;
  }

  @GetMapping("/incomplete")
  public List<TransactionView> incomplete() {
    return recoveryManager.listIncomplete();
  }

  @PostMapping("/run")
  public Map<String, Object> run(@RequestParam(defaultValue = "30") long staleSeconds) {
    List<TransactionView> recovered =
        recoveryManager.recoverStale(Duration.ofSeconds(staleSeconds));
    return Map.of("recovered", recovered.size(), "transactions", recovered);
  }

  @PostMapping("/transactions/{id}")
  public TransactionView recoverOne(@PathVariable String id) {
    return recoveryManager.recover(id);
  }
}
