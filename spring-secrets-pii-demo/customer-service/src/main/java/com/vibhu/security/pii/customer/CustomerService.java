package com.vibhu.security.pii.customer;

import com.vibhu.security.pii.secrets.SecretSanitizer;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public CustomerResponse create(CreateCustomerRequest request) {
        CustomerEntity entity = new CustomerEntity();
        entity.setFullName(request.fullName());
        entity.setEmailEncrypted(request.email());
        entity.setSsnEncrypted(request.ssn());
        entity.setPanLast4(request.panLast4());
        CustomerEntity saved = repository.save(entity);

        // Log only masked values — never plaintext PII
        log.info("Customer created id={} email={} ssn={}",
                saved.getId(),
                PiiMasking.maskEmail(request.email()),
                PiiMasking.maskSsn(request.ssn()));

        return toResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(UUID id, boolean fullPii) {
        CustomerEntity entity = repository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        if (fullPii && !currentUserHasPiiAdmin()) {
            throw new PiiAccessDeniedException("fullPii requires ROLE_PII_ADMIN");
        }

        log.info("Customer read id={} fullPii={} actor={}",
                id,
                fullPii,
                SecretSanitizer.redact(currentUsername()));

        return toResponse(entity, !fullPii);
    }

    CustomerResponse toResponse(CustomerEntity entity, boolean masked) {
        String email = entity.getEmailEncrypted();
        String ssn = entity.getSsnEncrypted();
        if (masked) {
            email = PiiMasking.maskEmail(email);
            ssn = PiiMasking.maskSsn(ssn);
        }
        return new CustomerResponse(
                entity.getId(),
                entity.getFullName(),
                email,
                ssn,
                PiiMasking.maskPanLast4(entity.getPanLast4()),
                masked,
                entity.getCreatedAt());
    }

    private boolean currentUserHasPiiAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PII_ADMIN".equals(a.getAuthority()));
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "anonymous" : auth.getName();
    }
}
