package com.vibhu.fai.payment;

import com.vibhu.fai.common.security.AuthContext;
import org.springframework.stereotype.Component;

@Component
public class PaymentAuthz {

  public void requirePaymentRead(AuthContext auth, Payment payment) {
    if (!auth.tenantId().equals(payment.getTenantId())) {
      throw new SecurityException("Cross-tenant payment access denied");
    }
  }

  public void requirePaymentWrite(AuthContext auth, Payment payment) {
    requirePaymentRead(auth, payment);
    if (!"APPROVER".equals(auth.role()) && !"ADMIN".equals(auth.role())) {
      throw new SecurityException("Write requires APPROVER/ADMIN role");
    }
  }
}
