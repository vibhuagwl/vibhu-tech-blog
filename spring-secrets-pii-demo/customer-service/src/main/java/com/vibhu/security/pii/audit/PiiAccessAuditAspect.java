package com.vibhu.security.pii.audit;

import com.vibhu.security.pii.customer.CustomerController;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Immutable audit trail when PII endpoints are hit — ship to SIEM in prod.
 */
@Aspect
@Component
public class PiiAccessAuditAspect {

    private static final Logger auditLog = LoggerFactory.getLogger("PII_AUDIT");

    @AfterReturning(pointcut = "execution(* com.vibhu.security.pii.customer.CustomerController.get(..))")
    public void auditRead(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        UUID customerId = (UUID) args[0];
        boolean fullPii = args.length > 1 && Boolean.TRUE.equals(args[1]);

        String actor = "anonymous";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            actor = auth.getName();
        }

        String clientIp = "unknown";
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            clientIp = request.getHeader("X-Forwarded-For");
            if (clientIp == null || clientIp.isBlank()) {
                clientIp = request.getRemoteAddr();
            }
        }

        PiiAccessEvent event = new PiiAccessEvent(
                Instant.now(),
                actor,
                "READ_CUSTOMER",
                customerId,
                fullPii,
                clientIp);

        auditLog.info("event={} actor={} customerId={} fullPii={} ip={}",
                event.action(),
                event.actor(),
                event.customerId(),
                event.fullPiiRequested(),
                event.clientIp());
    }
}
