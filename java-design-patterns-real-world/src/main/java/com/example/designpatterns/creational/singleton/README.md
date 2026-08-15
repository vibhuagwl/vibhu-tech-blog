# ConfigManager


## Full 21-section explanation board

**[`docs/patterns/singleton-explanation.md`](../../../../../../../../docs/patterns/singleton-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Application configuration cache shared across payment services.

## Problem

Fraud scoring, gateway routing, and ledger posting each maintain a separate copy of `payment.timeout` and `fraud.threshold`. When ops updates a threshold in one service, others keep stale values until restart.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Settlement jobs read 30s timeouts while the API gateway still uses 60s. Duplicate file parsing on every deploy multiplies memory use. Two threads constructing ConfigManager at startup can briefly see different maps.

## Pattern Solution

Holder-based singleton (and enum alternative) guarantees one shared config source. Static accessors like `paymentTimeout()` route every module through the same instance so fraud, gateway, and ledger stay aligned.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `ConfigManagerDemo` main demo class
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
