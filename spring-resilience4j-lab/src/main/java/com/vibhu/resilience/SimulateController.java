package com.vibhu.resilience;

import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Failure simulation — disabled under {@code prod}. Never expose this in a real bank. */
@Profile("!prod")
@RestController
@RequestMapping("/api/payment")
public class SimulateController {
  private final PaymentBankStub bank;

  public SimulateController(PaymentBankStub bank) {
    this.bank = bank;
  }

  @GetMapping("/simulate")
  public Map<String, Object> simulate(@RequestParam BankMode mode) {
    bank.setMode(mode);
    return Map.of("mode", mode.name(), "calls", bank.callCount());
  }
}
