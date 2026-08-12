package com.vibhu.security.pii.customer;

import com.vibhu.security.pii.common.dto.CreateCustomerRequest;
import com.vibhu.security.pii.common.dto.CustomerRecord;
import com.vibhu.security.pii.common.masking.PiiMasking;
import com.vibhu.security.pii.common.secrets.SecretSanitizer;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CustomerRecord create(CreateCustomerRequest request) {
        CustomerEntity entity = new CustomerEntity();
        entity.setFullName(request.fullName());
        entity.setEmailEncrypted(request.email());
        entity.setSsnEncrypted(request.ssn());
        entity.setPanLast4(request.panLast4());
        CustomerEntity saved = repository.save(entity);

        log.info("Customer created id={} email={} ssn={}",
                saved.getId(),
                PiiMasking.maskEmail(request.email()),
                PiiMasking.maskSsn(request.ssn()));

        return toRecord(saved);
    }

    @Transactional(readOnly = true)
    public CustomerRecord get(UUID id) {
        CustomerEntity entity = repository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        log.info("Internal customer read id={} caller=service",
                SecretSanitizer.redact(id.toString()));

        return toRecord(entity);
    }

    private CustomerRecord toRecord(CustomerEntity entity) {
        return new CustomerRecord(
                entity.getId(),
                entity.getFullName(),
                entity.getEmailEncrypted(),
                entity.getSsnEncrypted(),
                entity.getPanLast4(),
                entity.getCreatedAt());
    }
}
