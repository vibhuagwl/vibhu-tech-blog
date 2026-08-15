# Notification Bridge

## Interview Story

Email, SMS, and push notifications can run on multiple providers.

## Problem

Payment receipt alerts must go out as email or SMS through Twilio, SNS, or SendGrid. Product asks for push notifications next quarter.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Six combinations today become twelve with push. Each subclass duplicates formatting logic. Switching SMS vendor means editing every SMS subclass.

## Pattern Solution

EmailNotification and SmsNotification (abstraction) hold a Provider (TwilioProvider, SnsProvider). Compose any notification type with any transport without multiplying subclasses.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `NotificationBridgeDemo` main demo class
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
