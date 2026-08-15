# Payment Command


## Full 21-section explanation board

**[`docs/patterns/command-explanation.md`](../../../../../../docs/patterns/command-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Create, cancel, refund, and retry payments as queueable commands.

## Problem

Ops needs to replay last night's refund batch and audit which operator triggered each cancel. Today those are direct calls on PaymentReceiver with no history.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Failed mid-batch runs cannot resume. Compliance cannot prove who initiated a refund. Adding retry means new imperative code in the job runner, not a reusable operation object.

## Pattern Solution

CreatePaymentCommand, RefundPaymentCommand, and peers wrap PaymentReceiver calls. CommandInvoker queues and executes commands, enabling audit logs, deferred execution, and future undo support.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentCommandDemo` main demo class
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
