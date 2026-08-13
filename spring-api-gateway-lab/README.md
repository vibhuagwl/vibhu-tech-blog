# spring-api-gateway-lab

Interview utilities for API Gateway topics: token bucket, correlation ID propagation, route predicates.

Reference Spring Cloud Gateway YAML (run in a full SCG app):

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: payment-service
          uri: http://payment-service:8080
          predicates:
            - Path=/api/payments/**
            - Method=GET,POST
```

```bash
mvn test
```
