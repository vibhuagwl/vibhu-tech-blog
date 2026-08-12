package com.vibhu.security.resource.payment;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final Map<UUID, Payment> store = new ConcurrentHashMap<>();

    public List<Payment> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<Payment> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public Payment create(CreatePaymentRequest request) {
        Payment payment = new Payment(
                UUID.randomUUID(),
                request.fromAccount(),
                request.toAccount(),
                request.amount(),
                request.currency(),
                "CREATED");
        store.put(payment.id(), payment);
        return payment;
    }

    public boolean delete(UUID id) {
        return store.remove(id) != null;
    }
}
