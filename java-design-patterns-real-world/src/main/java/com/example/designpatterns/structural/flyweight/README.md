# CurrencyFlyweight


## Full 21-section explanation board

**[`docs/patterns/flyweight-explanation.md`](../../../../../../../../docs/patterns/flyweight-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Thousands of transactions share the same immutable currency metadata.

## Problem

End-of-day settlement materializes 5M ledger rows, each embedding `USD` and `$` strings even though the currency never changes within a batch.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Heap usage scales with row count, not currency diversity. Young-gen collections spike during batch import. Identical metadata strings fragment memory.

## Pattern Solution

CurrencyFlyweightDemo's factory returns shared CurrencyMetadata per ISO code. Line items keep only extrinsic amount; intrinsic symbol and code live once in the cache.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `CurrencyFlyweightDemo` main demo class
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
