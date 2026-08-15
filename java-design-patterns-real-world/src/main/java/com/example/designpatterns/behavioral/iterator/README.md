# Transaction Iterator

## Interview Story

Iterate transactions without exposing internal storage.

## Problem

Monthly statement generation loops over `repository.items` directly, assuming an in-memory ArrayList of all transactions.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Moving to paginated DB reads breaks every caller. External modules mutate the exposed list. Tests cannot swap in a fake repository without matching internal structure.

## Pattern Solution

TransactionIteratorDemo hides storage behind Iterable<Transaction>. Callers use enhanced-for; the repository can later stream pages without API changes.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `TransactionIteratorDemo` main demo class
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
