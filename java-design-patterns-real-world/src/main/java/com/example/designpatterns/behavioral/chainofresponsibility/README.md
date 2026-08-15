# PaymentValidation Chain of Responsibility

## Interview Story

Validation pipeline for payment requests.

## Problem

Payment submission runs authentication, amount limits, fraud flags, and account status inside a single service method with deeply nested conditionals.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Compliance asks to run fraud before amount check; the change risks regressions across all branches. Unit tests mock the entire method instead of one rule. Duplicate validation logic appears in batch and API paths.

## Pattern Solution

PaymentValidationChainDemo links AuthenticationValidator → AmountValidator → FraudValidator → AccountValidator. Each handler passes or stops; new rules insert as new links without editing peers.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentValidationChainDemo` main demo class
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
