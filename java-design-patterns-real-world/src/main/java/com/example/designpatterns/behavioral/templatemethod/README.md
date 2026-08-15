# PaymentProcessingTemplate


## Full 21-section explanation board

**[`docs/patterns/template-method-explanation.md`](../../../../../../docs/patterns/template-method-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

All payments follow validate/auth/process/audit/notify steps.

## Problem

Card checkout and UPI checkout both run validate, authenticate, process, audit, and notify — but two teams maintain nearly identical methods.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Card flow adds 3-D Secure in authenticate; UPI misses it for weeks. Someone reorders notify before audit in one path only. Code review cannot see skeleton violations easily.

## Pattern Solution

PaymentProcessingTemplateDemo's abstract PaymentProcessor.execute() locks step order. CardProcessor and UpiProcessor override only process(); validate, audit, and notify stay centralized.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentProcessingTemplateDemo` main demo class
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
