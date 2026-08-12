package com.vibhu.security.portal.payment;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final AtomicLong seq = new AtomicLong(1);
    private final List<PaymentView> payments = new ArrayList<>();

    @PreAuthorize("hasRole('USER')")
    public List<PaymentView> listFor(String username) {
        return payments.stream().filter(p -> p.owner().equals(username)).toList();
    }

    @PreAuthorize("hasRole('USER')")
    public PaymentView create(String username, BigDecimal amount, String note) {
        PaymentView payment = new PaymentView(seq.getAndIncrement(), username, amount, note);
        payments.add(payment);
        return payment;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentView> listAll() {
        return List.copyOf(payments);
    }

    public record PaymentView(long id, String owner, BigDecimal amount, String note) {}
}
