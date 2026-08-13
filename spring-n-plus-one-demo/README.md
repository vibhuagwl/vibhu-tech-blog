# Spring Data JPA — N+1 Problem Lab

Tiny Spring Boot app that shows the **N+1 query problem** and three fixes.

## Run

```bash
cd spring-n-plus-one-demo
mvn test
mvn spring-boot:run
```

| Endpoint | Behavior |
|---|---|
| `GET /api/authors/bad` | Classic N+1 (lazy `books` touched in a loop) |
| `GET /api/authors/join-fetch` | `JOIN FETCH` — 1 query |
| `GET /api/authors/entity-graph` | `@EntityGraph` — 1 query |
| `GET /api/authors/batch` | `Session#setFetchBatchSize` — 1 + few batched queries |
| `GET /api/authors/dto` | DTO / interface projection — no entity graph walk |

Logs print Hibernate SQL so you can count statements.

## Interview one-liner

> N+1 = 1 query to load parents + N queries for each lazy association. Fix with join fetch, entity graph, batch fetching, or DTO projections — prove it with SQL logs or a statement counter test.
