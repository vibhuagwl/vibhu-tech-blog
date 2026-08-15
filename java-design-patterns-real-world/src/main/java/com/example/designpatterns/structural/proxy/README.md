# PaymentService Proxy

## Interview Story

Protect and meter access to a payment service.

## Problem

Support dashboards poll `fetchStatus(paymentId)` hundreds of times per minute. Each call reaches the core ledger service with no auth check and no caching.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

DB connection pools saturate during incidents. A leaked internal URL lets unauthenticated scripts scrape settlement status. Every client reimplements token validation differently.

## Pattern Solution

PaymentServiceProxy implements PaymentService, rejects bad tokens, and caches SETTLED responses per paymentId before delegating to RealPaymentService.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentServiceProxyDemo` main demo class
- small nested collaborators that show the pattern without framework noise

## Run

Run tests or call this pattern from `DesignPatternDemo`.

## Interview Answer

I use this when the business pressure matches the shape of the pattern, not because the pattern name sounds impressive.

## Why This Pattern?

Because it solves the specific coupling or extensibility problem in the example.

## Why Not Another Pattern?

Because the competing pattern either solves creation instead of behavior, behavior instead of structure, or adds more indirection than this use case needs.

## Production Example

Senior backend systems use patterns inside orchestration, integrations, validation pipelines, eventing, and domain workflows.

## Common Mistake

Using the pattern before the real pressure exists.

## Senior-Level Follow-up

Discuss concurrency, testing boundaries, extension cost, and when to keep the code simpler.
