# Payment Facade

## Interview Story

One entry point orchestrates fraud, balance, audit, and notification services.

## Problem

Clients call five subsystems directly and get orchestration wrong.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

It becomes hard to extend, hard to test, and risky to change during production work.

## Pattern Solution

Facade exposes one simple processPayment API.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentFacadeDemo` main demo class
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

The richer example now returns a detailed outcome object so you can explain how the facade hides orchestration while still exposing business results.


## Common Mistake

Using the pattern before the real pressure exists.

## Senior-Level Follow-up

Discuss concurrency, testing boundaries, extension cost, and when to keep the code simpler.
