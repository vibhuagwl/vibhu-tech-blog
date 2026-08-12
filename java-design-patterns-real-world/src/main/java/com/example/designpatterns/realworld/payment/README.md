# Payment Processing System

## Interview Story

A customer starts a payment. The system must authenticate, validate, choose the right payment method, integrate with the right gateway, add logging and retry, move through lifecycle states, and notify downstream services.

## Combined Patterns

- Facade
- Chain of Responsibility
- Strategy
- Factory Method
- Adapter
- Decorator
- State
- Observer

## Flow

API Request  
-> PaymentFacade  
-> Validation Chain  
-> Payment Strategy  
-> Gateway Factory  
-> Gateway Adapter when legacy provider is chosen  
-> Logging / Metrics / Retry Decorators  
-> Payment State transitions  
-> Observers for audit / notification / reporting

## What I would say in an interview

I use a `PaymentFacade` as the single entry point so the caller does not orchestrate eight concerns manually. Inside, a validation chain rejects bad requests early. A strategy selects the payment algorithm by method, and a factory chooses the gateway implementation by provider. Legacy gateways are adapted behind the same interface. I then add logging, metrics, and retry through decorators so cross-cutting behavior stays composable. The payment moves through explicit state transitions instead of a switch block, and finally I publish the outcome to observers for audit, reporting, and customer notification.

## Why this example matters

This is how patterns appear in senior Java systems: not alone, but combined around one business flow.
