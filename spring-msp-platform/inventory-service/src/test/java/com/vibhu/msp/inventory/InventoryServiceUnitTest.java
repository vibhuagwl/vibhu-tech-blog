package com.vibhu.msp.inventory;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import com.vibhu.msp.common.events.OrderCreated;
import com.vibhu.msp.inventory.entity.StockEntity;
import com.vibhu.msp.inventory.repository.ReservationRepository;
import com.vibhu.msp.inventory.repository.StockRepository;
import com.vibhu.msp.inventory.service.InventoryService;
import com.vibhu.msp.inventory.service.OutboxService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class InventoryServiceUnitTest {

  @Test
  void reservesStock() {
    StockRepository stockRepository = Mockito.mock(StockRepository.class);
    ReservationRepository reservationRepository = Mockito.mock(ReservationRepository.class);
    OutboxService outboxService = Mockito.mock(OutboxService.class);
    StockEntity stock = new StockEntity();
    stock.setSku("SKU-1");
    stock.setAvailable(10);
    Mockito.when(stockRepository.findById("SKU-1")).thenReturn(java.util.Optional.of(stock));
    Mockito.when(reservationRepository.findByOrderId("ord-1"))
        .thenReturn(java.util.Optional.empty());

    InventoryService service =
        new InventoryService(stockRepository, reservationRepository, outboxService);
    OrderCreated order =
        new OrderCreated(
            "ord-1",
            "cust-1",
            BigDecimal.TEN,
            List.of(new OrderCreated.OrderLine("SKU-1", 2, BigDecimal.valueOf(5))));

    service.reserveForOrder(order, "cid-1");

    verify(stockRepository).save(any());
    verify(outboxService).enqueue(any(), any(), any(), any());
  }
}
