# Interpreter — Interview Explanation Board

> **Demo:** `TransactionRuleInterpreterDemo` — `src/main/java/com/example/designpatterns/behavioral/interpreter/TransactionRuleInterpreterDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Interpreter |
| **Category** | Behavioral |
| **One-line definition** | Define a representation for a grammar and an interpreter that uses the representation to evaluate sentences in the language. |
| **Problem class** | Fee waiver and compliance rules hard-coded as nested Java boolean branches. |

## 2. Problem We Are Solving

Rules like `amount > 1000 AND country = "IN"` determine fee waivers. Product changes rule strings; engineering redeploys for every tweak. Nested AND/OR in Java becomes unreadable spaghetti.

## 3. What Happens Without the Pattern

```java
if (t.amount() > 1000 && t.country().equals("IN")) { waive(); }
// every new rule shape = new branch
```

Pains: no runtime rule changes, combinatorial boolean explosion, rules not data-driven.

## 4. How the Pattern Solves It

1. **Expression** — `boolean interpret(Transaction t)`
2. **Terminal expressions** — `AmountGreaterThan`, `CountryEquals`
3. **Non-terminal** — `AndExpression(left, right)`
4. **Parser** — `parse(rule)` builds AST from string
5. **Client** — `expression.interpret(transaction)`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Abstract expression** | `Expression` | `interpret(Transaction)` |
| **Terminal** | `AmountGreaterThan`, `CountryEquals` | Leaf rule checks |
| **Non-terminal** | `AndExpression` | Combines sub-expressions |
| **Context** | `Transaction` record | Data evaluated against |
| **Parser** | `parse(String rule)` | String → AST |
| **Client** | `TransactionRuleInterpreterDemo.run()` | Parse + evaluate |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `AmountGreaterThan(limit).interpret(t)` | Terminal: amount check |
| `AndExpression(left, right).interpret(t)` | Combines with && |
| `parse(rule)` splits tokens, builds AST | Demo parser (simplified) |
| `expression.interpret(small)` → false for 500 IN | Evaluation walk |

## 7. Object/Class Diagram

```text
Expression
    ▲
    ├── AmountGreaterThan (terminal)
    ├── CountryEquals (terminal)
    └── AndExpression
            ├── left: Expression
            └── right: Expression
```

## 8. Runtime Execution Flow

```text
rule = "amount > 1000 AND country = \"IN\""
expression = parse(rule)
  → AndExpression(AmountGreaterThan(1000), CountryEquals("IN"))

small = Transaction(500, "IN")
expression.interpret(small)
  → 500 > 1000 false → false

large = Transaction(1500, "IN")
expression.interpret(large)
  → 1500 > 1000 true AND IN == IN → true
```

## 9. What the Client Doesn't Need to Know

- AST node types
- How parse tokenizes string
- Evaluation order inside `AndExpression`

## 10. Before vs After

**Before:** Java if-branches per rule combination.

**After:** Parse rule string → interpret against transaction.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New expression type extends grammar |
| **Composability** | Rules built from smaller expressions |

## 12. Extensibility

- `OrExpression`, `NotExpression`
- Full parser (ANTLR) for production grammar
- Store AST in DB, interpret at runtime

## 13. Advantages

- Rules as composable expression trees
- Runtime evaluation without redeploy (if AST stored)
- Clear mapping grammar → classes

## 14. Disadvantages

- Complex grammars need real parser — not hand-rolled split
- Performance vs compiled Java for hot paths
- Many classes for large grammars

## 15. When to Use

1. Small in-process rule languages (fee waivers)
2. Filter expressions in admin UI
3. SQL-like mini grammars (careful with scope)

## 16. When NOT to Use

1. Trivial one-line booleans
2. Full scripting — use Graal JS, Drools, etc.

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Parser bugs | Fuzz test rule strings |
| Security | No arbitrary code in rules |
| Performance | Cache parsed AST |
| Null country | Defensive interpret |

## 18. Possible Code Improvements

**Required:** Real parser; validate grammar; fail on malformed rules.

**Optional:** Rule catalog in DB; expression visitor for optimization.

## 19. Mental Model

**"Excel formula tree."** `AND(A>1000, country=IN)` parsed to nodes, evaluated on each row.

## 20. 30–60 Second Interview Answer

> Interpreter represents a grammar as an expression tree and evaluates it. Fee rules like amount > 1000 AND country = IN are hard-coded Java branches requiring redeploys. `Expression.interpret(Transaction)` on terminals `AmountGreaterThan`, `CountryEquals`, and `AndExpression`. `parse(rule)` builds AST from string. Transaction(500,IN) → false; Transaction(1500,IN) → true. Keep grammar small; use proper parser generators for large languages.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| vs Strategy? | Interpreter evaluates **grammar**; Strategy picks **algorithm** |
| vs Rules engine? | Interpreter is lightweight in-process; Drools for complex rules |
| Composite? | AST is often a Composite of expressions |

**Common mistake:** Using Interpreter for huge language — use parser generator + limited grammar.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.interpreter.TransactionRuleInterpreterDemo
```
