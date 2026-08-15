# Composite — interview board (redirect)

The full **21-section** Composite explanation board (problem-first, gold standard depth) lives here:

**[`docs/patterns/composite-explanation.md`](patterns/composite-explanation.md)**

That board expands the original narrative in this file into all required sections: pattern identification, naive approach pains, `OrderComponent` / `Product` / `Bundle` mapping, runtime recursion for `order.total()` → 1550, SOLID, interview answer, and follow-ups — all tied to `OrderCompositeDemo`.

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.composite.OrderCompositeDemo
```
