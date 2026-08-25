package com.example.payment.dto;

public record DashboardMetricsResponse(
        long totalPayments,
        long successCount,
        long failedCount,
        long pendingCount,
        long processingCount,
        long customerCount
) {
}
