package com.example.payment.config;

import com.example.payment.entity.AppUser;
import com.example.payment.entity.Customer;
import com.example.payment.entity.Payment;
import com.example.payment.entity.PaymentStatus;
import com.example.payment.entity.PaymentTransaction;
import com.example.payment.entity.Role;
import com.example.payment.repository.AppUserRepository;
import com.example.payment.repository.CustomerRepository;
import com.example.payment.repository.PaymentRepository;
import com.example.payment.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final boolean seedEnabled;
    private final AppUserRepository appUserRepository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            @Value("${app.seed.enabled:true}") boolean seedEnabled,
            AppUserRepository appUserRepository,
            CustomerRepository customerRepository,
            PaymentRepository paymentRepository,
            PaymentTransactionRepository transactionRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.seedEnabled = seedEnabled;
        this.appUserRepository = appUserRepository;
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }
        seedUsers();
        if (customerRepository.count() > 0) {
            log.info("Seed data already present — skipping payment seed");
            return;
        }
        List<Customer> customers = seedCustomers();
        seedPayments(customers);
        log.info("Seeded {} customers and {} payments", customers.size(), paymentRepository.count());
    }

    private void seedUsers() {
        upsertUser("admin", "admin123", Role.ADMIN);
        upsertUser("support", "support123", Role.SUPPORT);
        upsertUser("reader", "reader123", Role.READ_ONLY);
    }

    private void upsertUser(String username, String rawPassword, Role role) {
        appUserRepository.findByUsername(username).ifPresentOrElse(
                existing -> {
                    existing.setPasswordHash(passwordEncoder.encode(rawPassword));
                    existing.setRole(role);
                    existing.setEnabled(true);
                    appUserRepository.save(existing);
                },
                () -> appUserRepository.save(new AppUser(username, passwordEncoder.encode(rawPassword), role))
        );
    }

    private List<Customer> seedCustomers() {
        return customerRepository.saveAll(List.of(
                new Customer("Acme Retail", "billing@acme.example", "US"),
                new Customer("Globex Payments", "ops@globex.example", "GB"),
                new Customer("Initech Labs", "finance@initech.example", "DE")
        ));
    }

    private void seedPayments(List<Customer> customers) {
        PaymentStatus[] statuses = {
                PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.PENDING, PaymentStatus.PROCESSING
        };
        String[] currencies = {"USD", "EUR", "GBP"};
        ThreadLocalRandom random = ThreadLocalRandom.current();
        Instant base = Instant.now().minusSeconds(86_400);

        for (int i = 1; i <= 50; i++) {
            Customer customer = customers.get((i - 1) % customers.size());
            PaymentStatus status = statuses[(i - 1) % statuses.length];
            Instant created = base.plusSeconds(i * 300L);

            Payment payment = new Payment();
            payment.setAmount(BigDecimal.valueOf(25 + random.nextDouble(0, 975)).setScale(2, RoundingMode.HALF_UP));
            payment.setCurrency(currencies[i % currencies.length]);
            payment.setStatus(status);
            payment.setCustomer(customer);
            payment.setReference("PAY-SEED-" + String.format(Locale.ROOT, "%03d", i));
            payment.setCreatedAt(created);
            payment.setUpdatedAt(created.plusSeconds(30));
            Payment saved = paymentRepository.save(payment);

            transactionRepository.save(new PaymentTransaction(
                    saved, PaymentStatus.PENDING, "Payment accepted", created
            ));
            if (status == PaymentStatus.PROCESSING || status == PaymentStatus.SUCCESS || status == PaymentStatus.FAILED) {
                transactionRepository.save(new PaymentTransaction(
                        saved, PaymentStatus.PROCESSING, "Submitted to processor", created.plusSeconds(5)
                ));
            }
            if (status == PaymentStatus.SUCCESS) {
                transactionRepository.save(new PaymentTransaction(
                        saved, PaymentStatus.SUCCESS, "Settled", created.plusSeconds(20)
                ));
            } else if (status == PaymentStatus.FAILED) {
                transactionRepository.save(new PaymentTransaction(
                        saved, PaymentStatus.FAILED, "Processor declined", created.plusSeconds(20)
                ));
            }
        }
    }
}
