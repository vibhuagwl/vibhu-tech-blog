# ReportConfiguration Prototype


## Full 21-section explanation board

**[`docs/patterns/prototype-explanation.md`](../../../../../../../../docs/patterns/prototype-explanation.md)** — problem → without pattern → how it solves it → code mapping → runtime → interview answer (same format as Composite).

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Interview Story

Clone report templates for daily settlement reports.

## Problem

Treasury generates daily-settlement CSV reports for 40 countries. Each run rebuilds filters, format, and column maps from YAML even though only the country code changes.

## Naive Implementation

A central class owns every branch, every special case, and every integration detail.

## Why It Breaks

Startup latency grows linearly with region count. A typo in one YAML file ships wrong filters. Shallow clones let one tenant's edit corrupt another's report definition.

## Pattern Solution

ReportConfigurationPrototypeDemo keeps a validated base template. deepCopy() produces an independent clone; mutating the clone's country filter leaves the prototype intact.

## Code Flow

Business Problem -> Naive Implementation -> Problem with Naive Approach -> Design Pattern -> Java Implementation -> Execution Flow -> Production Improvement -> Interview Explanation

## Important Classes

- `ReportConfigurationPrototypeDemo` main demo class
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
