package com.example.kafka.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Auth denials belong next to SLO metrics — same observability hook as the Spring Security hub.
 */
@Component
public class SecurityAuditLogger {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditLogger.class);

    public void kafkaSecurityFailure(Throwable ex, String topic, int partition, long offset) {
        log.warn("KAFKA_SECURITY_DENIED topic={} partition={} offset={} type={} message={}",
                topic,
                partition,
                offset,
                ex.getClass()
                        .getSimpleName(),
                ex.getMessage());
    }

    public void publishedToDlt(String sourceTopic, String dltTopic, Throwable ex) {
        log.warn("KAFKA_DLT source={} dlt={} type={} message={}",
                sourceTopic,
                dltTopic,
                ex.getClass()
                        .getSimpleName(),
                ex.getMessage());
    }

    public void paymentPublished(String paymentId, String topic) {
        log.info("PAYMENT_PUBLISHED paymentId={} topic={}", paymentId, topic);
    }

    public void paymentConsumed(String paymentId, String topic) {
        log.info("PAYMENT_CONSUMED paymentId={} topic={}", paymentId, topic);
    }
}
