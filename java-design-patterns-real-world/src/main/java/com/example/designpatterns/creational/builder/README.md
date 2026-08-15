# PaymentTransaction Builder

## Interview Story

Building a complex payment transaction request.

## Problem

API clients must construct PaymentTransaction with transactionId, customerId, amount, currency, metadata, retryPolicy, fraudCheck, and callbackUrl. Teams added five constructor overloads and still ship transactions with null currency.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

A refund queued without fraudCheck bypasses screening. Metadata maps shared by reference mutate after build. Optional callback URLs are forgotten in three of twelve integration paths.

## Pattern Solution

PaymentTransactionBuilderDemo.Builder offers fluent setters with defaults (retryPolicy=NONE, fraudCheck=true). build() copies metadata and returns an immutable record ready for the gateway.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentTransactionBuilderDemo` main demo class
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
