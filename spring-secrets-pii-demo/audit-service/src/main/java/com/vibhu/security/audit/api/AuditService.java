package com.vibhu.security.audit.api;

import com.vibhu.security.audit.store.PiiAccessAuditEntity;
import com.vibhu.security.audit.store.PiiAccessAuditRepository;
import com.vibhu.security.pii.common.audit.PiiAccessEventRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

  private final PiiAccessAuditRepository repository;

  public AuditService(PiiAccessAuditRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public void record(PiiAccessEventRequest event) {
    PiiAccessAuditEntity row = new PiiAccessAuditEntity();
    row.setOccurredAt(event.at());
    row.setActor(event.actor());
    row.setSourceService(event.sourceService());
    row.setAction(event.action());
    row.setCustomerId(event.customerId());
    row.setFullPiiGranted(event.fullPiiGranted());
    row.setClientIp(event.clientIp());
    repository.save(row);
  }

  @Transactional(readOnly = true)
  public List<PiiAccessAuditEntity> findByCustomer(UUID customerId) {
    return repository.findByCustomerIdOrderByOccurredAtDesc(customerId);
  }
}
