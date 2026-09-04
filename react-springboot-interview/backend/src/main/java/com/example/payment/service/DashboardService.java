package com.example.payment.service;

import com.example.payment.dto.DashboardMetricsResponse;
import com.example.payment.entity.PaymentStatus;
import com.example.payment.repository.CustomerRepository;
import com.example.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;

    public DashboardService(PaymentRepository paymentRepository, CustomerRepository customerRepository) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse metrics() {
        return new DashboardMetricsResponse(paymentRepository.count(),
                paymentRepository.countByStatus(PaymentStatus.SUCCESS),
                paymentRepository.countByStatus(PaymentStatus.FAILED),
                paymentRepository.countByStatus(PaymentStatus.PENDING),
                paymentRepository.countByStatus(PaymentStatus.PROCESSING),
                customerRepository.count());
    }
}
