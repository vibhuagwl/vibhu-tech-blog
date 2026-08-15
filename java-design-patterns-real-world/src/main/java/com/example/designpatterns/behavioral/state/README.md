# Payment State


## Full 21-section explanation board

**[`docs/patterns/state-explanation.md`](../../../../../../../../docs/patterns/state-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Payment lifecycle transitions from CREATED to COMPLETED.

## Problem

Payments use a `status` string (`CREATED`, `AUTHORIZED`, …). A bug lets support call capture on a payment that was never authorized.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

switch(status) blocks appear in five services and drift apart. FAILED payments sometimes reach COMPLETED via a missed case. Refunds on SETTLED items need duplicate guards everywhere.

## Pattern Solution

PaymentStateDemo models each phase as a class. CreatedState.authorize() returns AuthorizedState; capture() before authorize throws. Payment delegates all moves to the active state object.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentStateDemo` main demo class
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

The richer example now includes a failed lifecycle path and a transition timeline so you can explain both valid and invalid state moves.


## Common Mistake

Using the pattern before the real pressure exists.

## Senior-Level Follow-up

Discuss concurrency, testing boundaries, extension cost, and when to keep the code simpler.
