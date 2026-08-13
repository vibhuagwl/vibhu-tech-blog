package com.vibhu.payment.model;

public record PaymentResponse(String paymentId, String processInstanceId, String status) {}
