# Order Composite — problem first, then the pattern

Exactly — for interviews, **don't start with the pattern**. Start with **the problem**, then show how Composite solves it.

## Full 21-section explanation board

**[`docs/patterns/composite-explanation.md`](../../../../../../../../docs/patterns/composite-explanation.md)**

House style: [`docs/PATTERN_EXPLANATION_FORMAT.md`](../../../../../../../../docs/PATTERN_EXPLANATION_FORMAT.md)

## Formula (30 seconds)

| | |
|--|--|
| **Problem** | Leaf + Group + nested groups → client `instanceof` / nested loops |
| **Solution** | Common `OrderComponent` + Bundle holds `List<OrderComponent>` → recursive `total()` |
| **Benefit** | Client treats product and bundle the same — Composite owns the tree |

## Run

```bash
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.composite.OrderCompositeDemo
```

Code: `OrderCompositeDemo.java`
