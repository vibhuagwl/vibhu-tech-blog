# Payment Ops Backend

Spring Boot 3.4 + Java 21 payment operations API (H2 by default).

## Run

```bash
cd backend
mvn spring-boot:run
```

API base: `http://localhost:8080/api/v1`

## Postgres (optional)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Requires `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

## Seeded users

| User    | Password    | Role      |
|---------|-------------|-----------|
| admin   | admin123    | ADMIN     |
| support | support123  | SUPPORT   |
| reader  | reader123   | READ_ONLY |

## Tests

```bash
mvn test
```
