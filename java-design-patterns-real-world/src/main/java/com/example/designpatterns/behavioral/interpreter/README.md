# TransactionRule Interpreter

## Interview Story

Evaluate simple AML transaction rules.

## Problem

Risk team defines waiver rules as `amount > 1000 AND country = "IN"` but engineering encodes each combination as nested if statements in Java.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

A rule change needs a full release. OR conditions duplicate branches. Business analysts cannot validate logic without reading production code.

## Pattern Solution

TransactionRuleInterpreterDemo parses rule strings into AmountGreaterThan, CountryEquals, and AndExpression nodes. interpret() walks the AST against each Transaction at runtime.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `TransactionRuleInterpreterDemo` main demo class
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
