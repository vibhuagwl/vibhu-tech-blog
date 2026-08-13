# Distributed Lock Interview Lab

Bank account **A100** debit with:

- `DistributedLock` (in-memory default, Redis with `--spring.profiles.active=redis`)
- Safe unlock token semantics (Redis Lua)
- Concurrent tests proving lock prevents overdraw

```bash
mvn test
mvn spring-boot:run
curl -X POST 'localhost:8080/api/accounts/A100/debit?amount=700'
```

Hub page: `/distributed-locking`
