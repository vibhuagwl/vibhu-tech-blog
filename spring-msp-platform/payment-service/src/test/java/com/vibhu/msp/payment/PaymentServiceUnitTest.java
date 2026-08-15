package com.vibhu.msp.payment;

import com.vibhu.msp.payment.repository.PaymentRepository;
import com.vibhu.msp.payment.service.OutboxService;
import com.vibhu.msp.payment.service.PaymentService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

class PaymentServiceUnitTest {

  @Test
  void declinesHighValueOrders() {
    PaymentRepository paymentRepository = Mockito.mock(PaymentRepository.class);
    OutboxService outboxService = Mockito.mock(OutboxService.class);
    PaymentService service = new PaymentService(paymentRepository, outboxService, new BigDecimal("10000"));

    service.processOrderPayment("ord-1", "cust-1", new BigDecimal("15000"), "cid-1");

    verify(paymentRepository).save(any());
    verify(outboxService).enqueue(any(), any(), any(), any());
  }
}
