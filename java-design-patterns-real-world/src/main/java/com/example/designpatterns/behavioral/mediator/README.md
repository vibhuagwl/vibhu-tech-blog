# OrderProcessing Mediator

## Interview Story

Order, payment, inventory, and notification services coordinate centrally.

## Problem

Checkout triggers PaymentService.authorize, which calls InventoryService.reserve, which calls NotificationService.notifyCustomer — each service imports the others.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Adding shipping requires edits in three services. Integration tests need the entire mesh running. A failure in notification rolls back logic scattered across classes.

## Pattern Solution

OrderProcessingMediatorDemo's placeOrder sequences payment, inventory, and notification. Colleagues expose narrow methods; only the mediator wires the workflow.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `OrderProcessingMediatorDemo` main demo class
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
