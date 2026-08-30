# 5-minute explanation

Traffic hits the **gateway** (JWT, coarse rate limit, correlation id).

**Flash-sale service** answers three questions in a few milliseconds: is the sale ACTIVE, have we seen this idempotency
key, and does Redis still think stock exists? If Redis says no, we return sold-out and never touch Kafka. If yes, we
write an outbox row and return **202 PENDING**. The user is not charged yet.

**Outbox** publishes `OrderRequested` keyed by `productId`.

**Inventory** runs `UPDATE … WHERE available >= qty`. One row updated means reserved; zero means reject and we increment
Redis back. PostgreSQL is the authority.

**Order service** is the saga orchestrator: create the order (unique per user+sale+product), request payment.

**Payment** talks to a provider behind a circuit breaker. Success confirms the order. Failure cancels and asks inventory
to **release**. Reservation expiry is the backstop if payment never answers.

**Outbox + idempotency + unique constraints** are how we get *business* exactly-once. Kafka idempotent producers only
stop duplicate *sends*.
