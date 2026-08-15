# Payment Strategy


## Full 21-section explanation board

**[`docs/patterns/strategy-explanation.md`](../../../../../../../../docs/patterns/strategy-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

UPI, card, PayPal, and bank transfer settlement algorithms.

## Problem

One `pay(String type, int amount)` method switches on UPI, CARD, PAYPAL, and BANK_TRANSFER with duplicated validation and provider-specific charge code.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Adding BNPL means editing the monolith method and twenty integration tests. Recurring eligibility for cards is tangled with UPI error handling. Copy-paste rails diverge on idempotency keys.

## Pattern Solution

UpiPaymentStrategy, CardPaymentStrategy, and peers implement PaymentStrategy. PaymentMethodRouter maps PaymentMethod to strategy; PaymentService.process() delegates without a type switch.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentStrategyDemo` main demo class
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

Payment methods arrive every quarter, but the service API stays the same. The richer example now shows recurring-payment support as a real business constraint.


## Common Mistake

Using the pattern before the real pressure exists.

## Senior-Level Follow-up

Discuss concurrency, testing boundaries, extension cost, and when to keep the code simpler.
