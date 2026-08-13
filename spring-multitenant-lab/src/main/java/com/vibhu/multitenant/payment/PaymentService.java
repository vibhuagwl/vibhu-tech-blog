package com.vibhu.multitenant.payment;

import com.vibhu.multitenant.common.OrderStatus;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.order.OrderEntity;
import com.vibhu.multitenant.order.OrderRepository;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private final PaymentRepository payments;
  private final OrderRepository orders;

  public PaymentService(PaymentRepository payments, OrderRepository orders) {
    this.payments = payments;
    this.orders = orders;
  }

  @Transactional
  public PaymentEntity pay(UUID orderId) {
    UUID tenantId = TenantContext.requireTenantId();
    OrderEntity order =
        orders.findByIdAndTenantId(orderId, tenantId).orElseThrow(() -> TenantExceptions.notFound("order"));
    PaymentEntity payment = new PaymentEntity();
    payment.setId(UUID.randomUUID());
    payment.setTenantId(tenantId);
    payment.setOrderId(orderId);
    payment.setAmount(order.getAmount());
    payment.setStatus("CAPTURED");
    payment.setProviderRef("lab-" + UUID.randomUUID());
    payment.setCreatedAt(Instant.now());
    PaymentEntity saved = payments.save(payment);
    order.setStatus(OrderStatus.PAID);
    order.setUpdatedAt(Instant.now());
    orders.save(order);
    return saved;
  }

  @Transactional(readOnly = true)
  public List<PaymentEntity> forOrder(UUID orderId) {
    return payments.findAllByTenantIdAndOrderId(TenantContext.requireTenantId(), orderId);
  }
}
