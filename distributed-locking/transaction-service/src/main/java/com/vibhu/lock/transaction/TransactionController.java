package com.vibhu.lock.transaction;

import com.vibhu.lock.common.TransferRequest;
import com.vibhu.lock.common.TransferResponse;
import com.vibhu.lock.transaction.TransactionDtos.TransactionView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransactionController {
  private final TransferService transferService;

  public TransactionController(TransferService transferService) {
    this.transferService = transferService;
  }

  @PostMapping
  public TransferResponse transfer(
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @RequestBody TransferRequest request
  ) {
    return transferService.transfer(request, idempotencyKey);
  }

  @GetMapping("/{transactionId}")
  public TransactionView get(@PathVariable String transactionId) {
    return transferService.get(transactionId);
  }

  @PostMapping("/{transactionId}/cancel")
  public TransactionView cancel(@PathVariable String transactionId) {
    return transferService.cancel(transactionId);
  }
}
