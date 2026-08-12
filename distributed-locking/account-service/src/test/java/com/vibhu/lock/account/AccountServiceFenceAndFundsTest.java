package com.vibhu.lock.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vibhu.lock.account.AccountDtos.CreateAccountRequest;
import com.vibhu.lock.account.AccountDtos.TransferApplyRequest;
import com.vibhu.lock.common.FenceTokenRejectedException;
import com.vibhu.lock.common.InsufficientFundsException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

@DataJpaTest
@Import({AccountService.class, DatabaseLockManager.class})
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AccountServiceFenceAndFundsTest {
  @Autowired
  AccountService accountService;

  @Test
  void rejectsInsufficientFundsAndStaleFence() {
    accountService.create(new CreateAccountRequest("A", new BigDecimal("10000")));
    accountService.create(new CreateAccountRequest("B", new BigDecimal("5000")));

    var ok = accountService.applyTransfer(new TransferApplyRequest(
        "tx1", "A", "B", new BigDecimal("7000"), 1, 1
    ));
    assertEquals(0, new BigDecimal("3000.00").compareTo(ok.sourceBalance()));

    assertThrows(InsufficientFundsException.class, () ->
        accountService.applyTransfer(new TransferApplyRequest(
            "tx2", "A", "B", new BigDecimal("6000"), 2, 2
        )));

    assertThrows(FenceTokenRejectedException.class, () ->
        accountService.applyTransfer(new TransferApplyRequest(
            "tx3", "A", "B", new BigDecimal("1"), 0, 0
        )));
  }
}
