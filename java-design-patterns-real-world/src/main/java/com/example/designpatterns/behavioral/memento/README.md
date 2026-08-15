# PaymentConfiguration Memento


## Full 21-section explanation board

**[`docs/patterns/memento-explanation.md`](../../../../../../docs/patterns/memento-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Rollback payment config after a bad release.

## Problem

An on-call engineer switches payment gateway from STRIPE to ADYEN during an incident and needs to roll back quickly if error rates spike.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Making fields public for rollback invites accidental edits elsewhere. Database restore is too slow for a 2 a.m. toggle. There is no lightweight undo stack.

## Pattern Solution

PaymentConfigurationMementoDemo.save() records gateway and timeout in an opaque Snapshot. restore() reapplies the memento; support keeps a stack of snapshots without reading private state.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentConfigurationMementoDemo` main demo class
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
