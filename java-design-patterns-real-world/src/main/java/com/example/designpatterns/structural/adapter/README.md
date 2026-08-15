# LegacyPaymentAdapter


## Full 21-section explanation board

**[`docs/patterns/adapter-explanation.md`](../../../../../../../../docs/patterns/adapter-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Integrate a legacy bank settlement API into a modern payment interface.

## Problem

The mobile app calls `pay(customerId, 10)` but the only available integration is a 15-year-old bank SDK with `submitLegacy(account, cents)`.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Every new feature reimplements cent conversion and account mapping. A missed multiply-by-100 undercharges merchants. Replacing the SDK is a multi-year project.

## Pattern Solution

PaymentAdapter implements ModernPaymentService, delegates to LegacyPaymentApi, and centralizes translation. Checkout, refunds, and webhooks all speak the modern interface.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `LegacyPaymentAdapterDemo` main demo class
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
