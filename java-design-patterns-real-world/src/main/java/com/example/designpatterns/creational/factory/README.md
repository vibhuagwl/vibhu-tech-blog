# PaymentGateway Factory

## Interview Story

Payment provider selection for Stripe, PayPal, and Adyen.

## Problem

CheckoutService, RefundService, and SubscriptionBilling each contain `if (provider.equals("STRIPE")) new StripeGateway()` branches. Product wants Adyen in Europe next sprint.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Every new PSP requires touching three services and their tests. Credentials and sandbox URLs get copy-pasted. A missed branch ships PayPal code to a Stripe-only merchant.

## Pattern Solution

PaymentGatewayFactory encapsulates provider selection behind `create(Provider)`. Business code charges through the PaymentGateway interface; only the factory knows which concrete gateway to construct.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `PaymentGatewayFactoryDemo` main demo class
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
