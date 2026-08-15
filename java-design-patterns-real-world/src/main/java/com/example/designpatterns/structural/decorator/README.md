# Payment Decorator


## Full 21-section explanation board

**[`docs/patterns/decorator-explanation.md`](../../../../../../../../docs/patterns/decorator-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Add fraud, logging, metrics, and retry around core payment processing.

## Problem

Every card charge needs audit logging, fraud screening, success metrics, and retry on transient gateway errors. Teams subclass BasicPayment for each mix.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

LoggingFraudRetryPayment duplicates charge logic. Reordering retry before fraud requires a new subclass. Unit tests must cover 2^4 decorator combinations.

## Pattern Solution

PaymentDecoratorDemo wraps BasicPayment with LoggingDecorator, MetricsDecorator, and RetryDecorator. Nest decorators at runtime; core charge logic never changes.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentDecoratorDemo` main demo class
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

## Richer Example Upgrade

The richer example now shows layered logging, metrics, fraud checks, and retry behavior around a flaky processor.


## Common Mistake

Using the pattern before the real pressure exists.

## Senior-Level Follow-up

Discuss concurrency, testing boundaries, extension cost, and when to keep the code simpler.
