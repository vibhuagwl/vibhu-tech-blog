# Payment Observer


## Full 21-section explanation board

**[`docs/patterns/observer-explanation.md`](../../../../../../../../docs/patterns/observer-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Payment completion notifies notification, audit, reporting, and fraud analytics.

## Problem

After capture, PaymentService directly invokes email receipt, audit log, and analytics pixel code inline.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Marketing wants a loyalty hook next sprint — that means a core payment deploy. A failing analytics call can block receipt email. Tests must stub every downstream integration inside PaymentService.

## Pattern Solution

PaymentObserverDemo registers CollectingObserver instances on PaymentEventBus. publish() notifies audit and analytics independently; new subscribers register without touching the publisher.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentObserverDemo` main demo class
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
