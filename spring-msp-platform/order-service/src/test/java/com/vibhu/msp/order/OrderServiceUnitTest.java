package com.vibhu.msp.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.msp.order.client.PaymentClient;
import com.vibhu.msp.order.entity.OrderEntity;
import com.vibhu.msp.order.entity.OrderEntity.OrderStatus;
import com.vibhu.msp.order.repository.OrderLineRepository;
import com.vibhu.msp.order.repository.OrderRepository;
import com.vibhu.msp.order.service.OrderService;
import com.vibhu.msp.order.service.OrderService.CreateOrderLine;
import com.vibhu.msp.order.service.OutboxService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class OrderServiceUnitTest {

  @Test
  void idempotencyReturnsSameOrder() {
    OrderRepository orderRepository = Mockito.mock(OrderRepository.class);
    OrderLineRepository orderLineRepository = Mockito.mock(OrderLineRepository.class);
    OutboxService outboxService = Mockito.mock(OutboxService.class);
    PaymentClient paymentClient = Mockito.mock(PaymentClient.class);
    ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    OrderEntity existing = new OrderEntity();
    existing.setId("ord-1");
    existing.setCustomerId("cust-1");
    existing.setTotalAmount(BigDecimal.TEN);
    existing.setStatus(OrderStatus.PENDING);
    when(orderRepository.findByIdempotencyKey("key-1")).thenReturn(java.util.Optional.of(existing));

    OrderService service =
        new OrderService(
            orderRepository, orderLineRepository, outboxService, paymentClient, objectMapper);

    OrderEntity result =
        service.createOrder(
            "key-1", "cust-1", List.of(new CreateOrderLine("SKU-1", 1, BigDecimal.TEN)));

    assertThat(result.getId()).isEqualTo("ord-1");
    Mockito.verify(orderRepository, Mockito.never()).save(any());
  }
}
