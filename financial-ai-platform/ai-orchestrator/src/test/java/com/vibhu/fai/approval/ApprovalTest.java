package com.vibhu.fai.approval;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.payment.PaymentRepository;
import com.vibhu.fai.payment.PaymentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApprovalTest {

  @Autowired ApprovalService approvals;
  @Autowired PaymentRepository payments;

  @Test
  void proposeThenApproveReversesPayment() {
    ApprovalRequest req =
        approvals.proposeReversal("TXN-1003", "Customer request", AuthContext.demo());
    assertThat(req.getStatus()).isEqualTo(ApprovalStatus.PENDING);

    ApprovalRequest executed =
        approvals.approve(req.getId(), new AuthContext("TENANT-1", "approver-1", "APPROVER"));
    assertThat(executed.getStatus()).isEqualTo(ApprovalStatus.EXECUTED);
    assertThat(payments.findById("TXN-1003").orElseThrow().getStatus())
        .isEqualTo(PaymentStatus.REVERSED);
  }
}
