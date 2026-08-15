# Interpreter — Interview Explanation Board

> **Demo:** `TransactionRuleInterpreterDemo` — `src/main/java/com/example/designpatterns/behavioral/interpreter/TransactionRuleInterpreterDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Interpreter |
| **Category** | Behavioral |
| **One-line definition** | Define a representation for a grammar and an interpreter that uses the representation to evaluate sentences in the language. |
| **Problem class** | Fee waiver and compliance rules hard-coded as nested Java boolean branches — redeploy for every rule tweak. |

## 2. Problem We Are Solving

Payment platform applies **fee waiver rules** to transactions:

```text
Rule string:  amount > 1000 AND country = "IN"
Transaction:  amount=1500, country=IN  → waive fee
Transaction:  amount=500,  country=IN  → no waiver
```

Rules combine:

- **Amount thresholds** — `amount > 1000`
- **Country checks** — `country = "IN"`
- **Boolean composition** — `AND`, (future: `OR`, `NOT`)

Product changes rule strings in admin UI; engineering currently redeploys for every tweak.

The painful questions:

> How do you evaluate `amount > 1000 AND country = "IN"` **without** a new `if` branch for every combination?

> How do rules become **data** (strings / AST in DB) evaluated at runtime?

Relationships:

- **Context** (`Transaction` record) — `amount`, `country` being evaluated
- **Expression** — `boolean interpret(Transaction)`
- **Terminal expressions** — leaf checks (`AmountGreaterThan`, `CountryEquals`)
- **Non-terminal** — composite (`AndExpression`)
- **Parser** — `parse(rule)` builds AST from string
- **Client** — parse once, interpret many transactions

## 3. What Happens Without the Pattern

Naive hard-coded rules:

```java
boolean shouldWaiveFee(Transaction t) {
    if (t.amount() > 1000 && t.country().equals("IN")) {
        return true;
    }
    if (t.amount() > 5000 && t.country().equals("US")) {
        return true;
    }
    if (t.amount() > 2000 && t.country().equals("GB")) {
        return true;
    }
    // every new rule = new branch — combinatorial explosion
    return false;
}
```

Concrete pains:

1. **Redeploy for rule change** — product cannot tune rules without release
2. **Boolean spaghetti** — nested AND/OR unreadable in Java
3. **No composability** — cannot build `AND(A, OR(B,C))` from reusable pieces
4. **Rules not data** — cannot store rule string in database
5. **Testing nightmare** — matrix of branches grows exponentially
6. **Grammar locked in code** — new operator (NOT) touches all services

SOLID hits: **OCP** violated — new rule shape edits service; **SRP** blurred — payment service owns parsing + business.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — rules as nested Java `if` branches
2. **Naive pain** — redeploy per tweak; boolean combinatorial explosion
3. **Pattern introduces** — `Expression` interface with `interpret(Transaction)`
4. **Terminal nodes** — `AmountGreaterThan(1000)`, `CountryEquals("IN")`
5. **Non-terminal** — `AndExpression(left, right)` combines sub-expressions
6. **Parser** — `parse("amount > 1000 AND country = \"IN\"")` builds AST
7. **Evaluation** — `expression.interpret(transaction)` walks tree
8. **Client** — parse once; interpret against many transactions

Rules become an **expression tree** (AST), not scattered conditionals.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Abstract expression** | `Expression` interface | `boolean interpret(Transaction)` |
| **Terminal expression** | `AmountGreaterThan` | Leaf: amount comparison |
| **Terminal expression** | `CountryEquals` | Leaf: country equality |
| **Non-terminal expression** | `AndExpression` | Combines left and right with AND |
| **Context** | `Transaction` record | Data evaluated against (`amount`, `country`) |
| **Parser** | `parse(String rule)` | String → AST (demo: simplified tokenizer) |
| **Client** | `TransactionRuleInterpreterDemo.run()` | Parse rule, interpret small/large tx |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `interface Expression { boolean interpret(Transaction transaction); }` | Uniform evaluate contract for all nodes |
| `AmountGreaterThan(limit).interpret(t)` → `t.amount() > limit` | Terminal expression — leaf check |
| `CountryEquals(country).interpret(t)` → `t.country().equals(country)` | Terminal — country match |
| `AndExpression(left, right).interpret(t)` | Non-terminal — delegates to children |
| `left.interpret(t) && right.interpret(t)` | Tree evaluation recurses |
| `parse(rule)` splits tokens, builds `AndExpression(...)` | Demo parser — production needs real parser |
| `expression.interpret(small)` → false for amount=500 | Evaluation against live transaction |
| `expression.interpret(large)` → true for amount=1500, IN | Both conditions satisfied |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────┐
                    │  <<interface>>      │
                    │  Expression         │
                    │  + interpret(T): bool│
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌──────▼──────────┐
│ AmountGreater   │  │ CountryEquals     │  │ AndExpression     │
│ Than (terminal) │  │ (terminal)        │  │ (non-terminal)    │
│ - limit: int    │  │ - country: String │  │ - left: Expression│
│ + interpret()   │  │ + interpret()     │  │ - right: Expression│
└─────────────────┘  └───────────────────┘  │ + interpret()     │
                                            └─────────┬─────────┘
                                                      │
                                            contains Expression children

Context: Transaction(amount, country)
Parser: parse(String) → Expression AST
```

## 8. Runtime Execution Flow

From `TransactionRuleInterpreterDemo.run()`:

```text
STEP 1: Parse rule string
  rule = "amount > 1000 AND country = \"IN\""
  expression = parse(rule)

  parse() internally:
    tokens = ["amount", ">", "1000", "AND", "country", "=", "\"IN\""]
    AST = AndExpression(
            AmountGreaterThan(1000),
            CountryEquals("IN")
          )

STEP 2: Evaluate below threshold
  small = Transaction(500, "IN")
  expression.interpret(small)
    AndExpression.interpret(small)
      left: 500 > 1000 → false
      right: "IN".equals("IN") → true
      false && true → false
  Output: amount=500, country=IN → false

STEP 3: Evaluate matching transaction
  large = Transaction(1500, "IN")
  expression.interpret(large)
    left: 1500 > 1000 → true
    right: "IN".equals("IN") → true
    true && true → true
  Output: amount=1500, country=IN → true
```

## 9. What the Client Doesn't Need to Know

- AST node types (`AmountGreaterThan` vs `AndExpression`)
- How `parse` tokenizes the rule string
- Evaluation order inside `AndExpression` (left then right)
- That AST is a small Composite of expressions
- Token index positions in demo parser

Client mental model: **parse rule → interpret(transaction)**.

## 10. Before vs After

### Without Interpreter

```text
PaymentService.shouldWaiveFee(t)
   │
   ├── if amount > 1000 && country IN
   ├── if amount > 5000 && country US
   └── if ... (grows forever)

Rules locked in Java source
```

### With Interpreter

```text
expression = parse(ruleString)    // once, or load AST from DB

expression.interpret(transaction)
   │
   └── AndExpression
         ├── AmountGreaterThan.interpret()
         └── CountryEquals.interpret()

Rules as composable expression tree
```

**Grammar lives in expression classes; rules become data.**

## 11. SOLID / Design Principles

| Principle | How Interpreter applies |
|-----------|-------------------------|
| **Open/Closed** | New expression type (`OrExpression`) extends grammar without editing terminals |
| **Composability** | Rules built from smaller expressions — mirrors grammar productions |
| **Single Responsibility** | Parser builds tree; expressions evaluate; service orchestrates |
| **Immutability** | Expression trees should be immutable after parse |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| `OR` / `NOT` | `OrExpression`, `NotExpression` | More expression classes |
| Full grammar | ANTLR / parser generator | Interpreter not hand-rolled split |
| Rules in DB | Store rule string or serialized AST | Parse on load, cache AST |
| vs Rules engine | Drools for complex dependency rules | Interpreter for small in-process grammar |
| vs Strategy | Strategy picks algorithm | Interpreter evaluates **grammar sentence** |
| Performance | Cache parsed AST per rule id | Interpret is tree walk — OK for small trees |

## 13. Advantages

- Rules as composable expression trees instead of nested `if`
- Runtime evaluation when AST stored — no redeploy for rule text change
- Clear mapping: grammar production → expression class
- Same AST interpreted against many transactions efficiently
- Product-facing rule strings become executable

## 14. Disadvantages

- Complex grammars need real parser — demo `split(" ")` is fragile
- Performance vs compiled Java for hot paths (tree walk per transaction)
- Many classes for large grammars — class explosion
- Security risk if rule language too powerful — no arbitrary code
- Debugging harder than single `if` — need AST pretty-print

## 15. When to Use

1. Small in-process rule languages (fee waivers, feature flags filters)
2. Filter expressions in admin UI (`amount > X AND country = Y`)
3. SQL-like mini grammars with **bounded** scope
4. Repeated evaluation of same rule against many contexts
5. Boolean rule composition with AND/OR/NOT

## 16. When NOT to Use

1. Trivial one-line boolean — `if` is clearer
2. Full scripting language — Graal JS, Groovy, Lua sandbox
3. Complex dependency rules — Drools, Easy Rules
4. Huge grammar — parser generator + limited DSL, not hand-built Interpreter classes

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Parser bugs** | Fixed token positions | Fuzz test rule strings; reject malformed |
| **Security** | No code execution | Never `eval()` user strings as Java |
| **Null country** | `equals` on null NPE | Defensive `Objects.equals` in terminals |
| **Performance** | Parse every run | Cache AST by rule id |
| **Malformed rule** | Demo assumes valid input | Parse errors with user-facing message |
| **Grammar growth** | Only AND | Cap grammar complexity; escalate to rules engine |

## 18. Possible Code Improvements

### Required (correctness)

- Real parser (ANTLR) instead of `rule.split(" ")`
- Validate grammar; fail fast on malformed rules
- Null-safe `CountryEquals.interpret`

### Optional (clarity / prod)

- `OrExpression`, `NotExpression` for full boolean grammar
- Rule catalog in DB with cached AST
- Expression visitor for optimization (constant folding)
- Pretty-print AST for support debugging

## 19. Mental Model

**Formula:**

```text
Problem:  Rules as nested if-branches → redeploy + spaghetti
Solution: Grammar → Expression AST → interpret(context) per evaluation
Benefit:  Composable rules as data; runtime evaluation
```

Memory trick: **"Excel formula tree — AND(A>1000, country=IN) parsed to nodes, evaluated on each row."**

## 20. 30–60 Second Interview Answer

> **Interpreter** defines a grammar representation and evaluates sentences in that language. Fee waiver rules like `amount > 1000 AND country = "IN"` are hard-coded Java branches — every product tweak needs a redeploy. We define `Expression` with `interpret(Transaction)`, terminal expressions `AmountGreaterThan` and `CountryEquals`, and non-terminal `AndExpression` combining children. `parse(rule)` builds the AST from the rule string. `Transaction(500, IN)` → false; `Transaction(1500, IN)` → true. The AST is essentially a small Composite of expressions. Keep the grammar **small** — use ANTLR or a rules engine for large languages. Cache parsed trees in production; never execute arbitrary code from rule strings.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| vs Strategy? | Interpreter evaluates **grammar sentence**; Strategy picks **algorithm** |
| vs Rules engine? | Interpreter = lightweight in-process; Drools for complex rules |
| Composite relation? | AST of expressions is often a Composite structure |
| Security? | Sandboxed grammar only — no general scripting |
| Performance? | Cache AST; tree walk per tx — OK for small trees |

**Common mistake:** Using Interpreter for a huge language — use parser generator + limited DSL.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.interpreter.TransactionRuleInterpreterDemo
```
