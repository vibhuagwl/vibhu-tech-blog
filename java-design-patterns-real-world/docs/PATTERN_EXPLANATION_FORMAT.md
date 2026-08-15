# Design Pattern Code Explanation Format

House style for every GoF demo in this repo and for Cursor agents explaining pattern code.

**Goal:** Understand WHY the pattern was introduced, WHAT problem it solves, HOW the code solves it, and WHY this design beats the naive approach — not line-by-line syntax.

When explaining (or writing docs for) any Design Pattern implementation, follow this **exact structure**.

---

## Required final structure (21 sections)

1. **Pattern Identification** — name, category, one-line definition, general problem class
2. **Problem We Are Solving** — real-world story first (objects, relationships, why it gets hard)
3. **What Happens Without the Pattern** — naive approach + concrete pains (`instanceof`, switches, coupling, SOLID hits)
4. **How the Pattern Solves It** — conceptual chain: Problem → naive pain → pattern introduces X → client simplifies
5. **Pattern → Code Mapping** — table of roles → classes + WHY each role
6. **Important Code Lines** — design significance of critical fields/methods (not Java syntax)
7. **Object/Class Diagram** — ASCII tree / relationships
8. **Runtime Execution Flow** — concrete `main`-style walkthrough with recursion/delegation
9. **What the Client Doesn't Need to Know** — hidden complexity
10. **Before vs After** — client-centric diagrams
11. **SOLID / Design Principles** — only principles that genuinely apply
12. **Extensibility** — new types / new operations / trade-offs
13. **Advantages**
14. **Disadvantages** / over-engineering risk
15. **When to Use** — 3–5 practical scenarios
16. **When NOT to Use**
17. **Edge Cases / Production Concerns** — null, cycles, threads, etc. relevant to *this* code
18. **Possible Code Improvements** — Required vs Optional
19. **Mental Model** — short formula / memory trick
20. **30–60 Second Interview Answer** — what / problem / how / roles / one example
21. **Likely Interview Follow-ups** — Qs + one common mistake

---

## Style rules

### Rule 1 — Problem first
Never start with “`OrderComponent` is an interface…”. Start with “What problem are we trying to solve?”

### Rule 2 — Explain WHY, not just WHAT
Bad: `Bundle` contains a list of `OrderComponent`.  
Good: …because that lets it hold Products **and** other Bundles → recursive tree.

### Rule 3 — Connect code → role → why → problem solved

### Rule 4 — Concrete examples over abstractions

### Rule 5 — Client perspective (before vs after)

### Rule 6 — Runtime flow when a method is called

### Rule 7 — Distinguish “normal Java” vs “what makes this the pattern”

### Rule 8 — Interview-oriented close (30s answer, terms, follow-ups, mistake, example)

---

## Doc locations in this repo

| Artifact | Path |
|----------|------|
| This format | `docs/PATTERN_EXPLANATION_FORMAT.md` |
| Per-pattern boards | `docs/patterns/<pattern>-explanation.md` |
| Composite gold standard | `docs/patterns/composite-explanation.md` (also linked from `docs/composite-problem-solution.md`) |
| Catalog | `docs/problem-and-solution.md` |
| Runnable demos | `src/main/java/.../*Demo.java` (`run()` / `main`) |

Agents: when adding or revising a pattern board, match the Composite gold standard section order and depth.
