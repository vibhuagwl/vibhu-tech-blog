# Visitor — Interview Explanation Board

> **Demo:** `AccountVisitorDemo` — `src/main/java/com/example/designpatterns/behavioral/visitor/AccountVisitorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Visitor |
| **Category** | Behavioral |
| **One-line definition** | Represent an operation to perform on elements of an object structure; lets you define new operations without changing the element classes. |
| **Problem class** | Interest, tax, and fee calculations need different math per account type — adding operations bloats every account class. |

## 2. Problem We Are Solving

Retail bank accounts share a common `Account` interface but differ in behavior:

```text
SavingsAccount   balance=10000   → interest rate 4%
CurrentAccount   balance=5000    → interest rate 1%
LoanAccount      principal=20000 → interest rate 11% on principal
```

Platform needs **interest calculation** today. Tomorrow: annual fee, tax report, regulatory export.

The painful questions:

> How do you add `annualFee()` **without** editing `SavingsAccount`, `CurrentAccount`, and `LoanAccount`?

> How do you keep account classes focused on core banking while **reporting operations** grow?

Relationships:

- **Element** (`Account`) — `accept(AccountVisitor<T> visitor)`
- **Concrete elements** — `SavingsAccount`, `CurrentAccount`, `LoanAccount`
- **Visitor** (`AccountVisitor<T>`) — `visit` overload per concrete type
- **Concrete visitor** — `InterestCalculationVisitor` — type-specific math external to accounts
- **Client** — creates accounts and calls `account.accept(visitor)`
- **Double dispatch** — `accept` calls `visitor.visit(this)` resolving correct overload

## 3. What Happens Without the Pattern

Naive account classes accumulate operations:

```java
public class SavingsAccount {
    double balance;
    double interest() { return balance * 0.04; }
    double annualFee() { return 50.0; }      // pollutes account
    double taxLiability() { ... }            // more pollution
}

public class CurrentAccount {
    double balance;
    double interest() { return balance * 0.01; }
    double annualFee() { return 100.0; }
    double taxLiability() { ... }
}

public class LoanAccount {
    double principal;
    double interest() { return principal * 0.11; }
    double annualFee() { ... }
    double taxLiability() { ... }
}
```

Concrete pains:

1. **Account classes swell** — unrelated reporting methods on domain model
2. **New operation** (tax report) edits **every** account type
3. **Poor separation** — core account vs reporting logic mixed
4. **Compile-time coupling** — all operations bundled into element hierarchy
5. **Team conflicts** — reporting team edits account classes constantly
6. **Hard to group** — interest + tax logic scattered across three classes

SOLID hits: **OCP** violated for new operations; **SRP** — account owns too many concerns.

## 4. How the Pattern Solves It

Conceptual chain:

1. **Problem** — each new operation requires editing all account types
2. **Naive pain** — `interest()`, `annualFee()`, `tax()` inside every class
3. **Pattern introduces** — `AccountVisitor<T>` with `visit` per concrete account
4. **Elements** — accounts only implement `accept(visitor)` — no interest math inside
5. **Concrete visitor** — `InterestCalculationVisitor` holds rate logic externally
6. **Double dispatch** — `savings.accept(visitor)` → `visitor.visit(savings)` → 4% rate
7. **Client** — loops accounts, same visitor, gets `Double` interest per type

New operations add **new visitor classes**, not account edits.

## 5. Pattern → Code Mapping

| Pattern role | Demo class / type | Why this role |
|--------------|-------------------|---------------|
| **Element** | `Account` interface | `accept(AccountVisitor<T> visitor)` |
| **Concrete element** | `SavingsAccount` | `balance`; dispatches to visitor |
| **Concrete element** | `CurrentAccount` | `balance`; different visit overload |
| **Concrete element** | `LoanAccount` | `principal`; loan-specific visit |
| **Visitor** | `AccountVisitor<T>` | `visit` overload per concrete type |
| **Concrete visitor** | `InterestCalculationVisitor` | Implements interest rates externally |
| **Client** | `AccountVisitorDemo.run()` | `accept(visitor)` on each account |

## 6. Important Code Lines

| Code | Design significance |
|------|---------------------|
| `<T> T accept(AccountVisitor<T> visitor)` | Element entry point for double dispatch |
| `return visitor.visit(this)` in each account | Dispatches to correct `visit` overload |
| `T visit(SavingsAccount account)` on visitor | Type-specific operation signature |
| `account.balance() * 0.04` in `visit(SavingsAccount)` | Logic lives in visitor, not account |
| `account.balance() * 0.01` in `visit(CurrentAccount)` | Different rate without editing account |
| `account.principal() * 0.11` in `visit(LoanAccount)` | Loan uses principal, not balance |
| `AccountVisitor<Double>` generic | Visit methods return computed `Double` interest |

## 7. Object/Class Diagram

```text
                    ┌─────────────────────┐
                    │  <<interface>>      │
                    │  Account (Element)  │
                    │  + accept(visitor)  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌──────▼──────────┐
│ SavingsAccount  │  │ CurrentAccount    │  │ LoanAccount     │
│ - balance       │  │ - balance         │  │ - principal     │
│ + accept(v)     │  │ + accept(v)       │  │ + accept(v)     │
└────────┬────────┘  └─────────┬─────────┘  └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │ accept(visitor)
                               ▼
                    ┌─────────────────────┐
                    │ AccountVisitor<T>   │
                    │ + visit(Savings)    │
                    │ + visit(Current)    │
                    │ + visit(Loan)       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ InterestCalculation │
                    │ Visitor             │
                    │ visit(Savings)→4%   │
                    │ visit(Current)→1% │
                    │ visit(Loan)→11%   │
                    └─────────────────────┘
```

## 8. Runtime Execution Flow

From `AccountVisitorDemo.run()`:

```text
STEP 1: Create accounts (stable structure)
  savings = SavingsAccount(10000)
  current = CurrentAccount(5000)
  loan = LoanAccount(20000)

STEP 2: Create visitor
  visitor = InterestCalculationVisitor()

STEP 3: Double dispatch on each account

  savings.accept(visitor)
    → SavingsAccount.accept(visitor)
    → visitor.visit(savings)
    → 10000 * 0.04 = 400.0

  current.accept(visitor)
    → visitor.visit(current)
    → 5000 * 0.01 = 50.0

  loan.accept(visitor)
    → visitor.visit(loan)
    → 20000 * 0.11 = 2200.0

Console:
  Savings interest: 400.0
  Current interest: 50.0
  Loan interest: 2200.0

Adding TaxVisitor would repeat accept() with new visitor — no account edits.
```

## 9. What the Client Doesn't Need to Know

- Which `visit` overload executes for each account
- Interest rates stored inside `InterestCalculationVisitor`
- That double dispatch occurred (`accept` → `visit(this)`)
- Internal fields accessed by visitor (`balance` vs `principal`)
- How many visitor classes exist in the system

Client mental model: **account.accept(visitor) returns result**.

## 10. Before vs After

### Without Visitor

```text
SavingsAccount
   ├── interest()
   ├── annualFee()
   └── tax()

CurrentAccount
   ├── interest()
   ├── annualFee()
   └── tax()

LoanAccount
   ├── interest()
   ├── annualFee()
   └── tax()

New operation → edit ALL account classes
```

### With Visitor

```text
SavingsAccount    ──accept──► InterestCalculationVisitor.visit(Savings)
CurrentAccount    ──accept──► InterestCalculationVisitor.visit(Current)
LoanAccount       ──accept──► InterestCalculationVisitor.visit(Loan)

Accounts: only accept(visitor)
Operations: live in visitor classes

New operation → new AnnualFeeVisitor class
```

**Operations externalized; elements stay thin.**

## 11. SOLID / Design Principles

| Principle | How Visitor applies |
|-----------|---------------------|
| **Open/Closed** | New operation = new visitor; elements stable |
| **Single Responsibility** | Accounts model accounts; visitors model operations |
| **Trade-off** | New **account type** requires updating **all** visitors |
| **Dependency** | Visitor needs element internals — encapsulation tension |

## 12. Extensibility

| Change | Approach | Trade-off |
|--------|----------|-----------|
| Annual fee operation | `AnnualFeeVisitor` implements `AccountVisitor<Double>` | New class only |
| Tax report | `TaxReportVisitor` | Group related ops in one visitor |
| New account type | Add `visit(CreditAccount)` to **every** visitor | Visitor pain point |
| Java 21 alternative | Sealed `Account` + pattern switch | When ops rare, types change |
| vs Strategy | Strategy: one context, many algorithms | Visitor: many types, one operation pass |
| Collections | Loop `accounts.forEach(a -> a.accept(visitor))` | Same visitor across portfolio |

## 13. Advantages

- Add operations without editing element classes
- Related operations grouped in one visitor class
- Clean, thin account domain models
- Compiler enforces `visit` overload per concrete type
- Generic `AccountVisitor<T>` returns typed results

## 14. Disadvantages

- New element type breaks **all** visitors — add overload everywhere
- Encapsulation break — visitor reads `balance`, `principal` directly
- Many `visit` methods for large hierarchies
- Double dispatch harder to explain than simple method on element
- Modern Java: sealed types + switch may be simpler when hierarchy changes often

## 15. When to Use

1. Interest/tax/fee operations over **stable** account hierarchy
2. Compiler AST passes (parse, optimize, codegen) — classic Visitor domain
3. Document export (HTML, PDF, Markdown) over same structure
4. Frequent **new operations**, rare **new types**
5. Portfolio analytics walking heterogeneous accounts uniformly

## 16. When NOT to Use

1. Account types change often — sealed switch may be simpler
2. Single operation — method on element is fine
3. Deep hierarchy with few operations — overhead not justified
4. Cannot tolerate visitor accessing element internals

## 17. Edge Cases / Production Concerns

| Concern | In this demo | Production note |
|---------|--------------|-----------------|
| **Encapsulation** | Visitor reads balance/principal | Document accepted break; or expose read-only API |
| **Null visitor** | No guard | Reject null in `accept()` |
| **Null accounts** | Not handled | Skip or fail in client loop |
| **Collections** | Three separate accounts | Batch: one visitor, many `accept` calls |
| **Performance** | Virtual dispatch per accept | Usually fine; profile hot paths |
| **New type** | 3 visitors if 3 visitor classes | Plan migration when adding account type |
| **Side effects** | Pure calculation | Name visitors clearly if they persist (e.g. `PersistAuditVisitor`) |

## 18. Possible Code Improvements

### Required (correctness)

- Null-safe `accept` — reject null visitor
- Document that visitors may read element state

### Optional (clarity / prod)

- `AnnualFeeVisitor`, `TaxReportVisitor` as additional demos
- Sealed `Account` interface for Java 21 pattern-match alternative
- Portfolio `visitAll(List<Account>, visitor)` helper
- Read-only `AccountView` to limit what visitors access

## 19. Mental Model

**Formula:**

```text
Problem:  New operation edits every element class
Solution: accept(visitor) + visit(per type) → operation externalized
Benefit:  Stable structure + frequent new ops without element churn
Trade-off: New element type edits all visitors
```

Memory trick: **"Inspector touring building types — same inspector, different checklist per room; rooms don't list every inspection themselves."**

## 20. 30–60 Second Interview Answer

> **Visitor** lets you define new operations on a stable object structure without changing element classes. Interest calculation needs different math for Savings (4%), Current (1%), and Loan (11% on principal) — adding annual fee would bloat every account class. Each account implements `accept(visitor)` which calls `visitor.visit(this)` — **double dispatch** to the right overload. `InterestCalculationVisitor` implements `visit(SavingsAccount)`, `visit(CurrentAccount)`, `visit(LoanAccount)` with type-specific logic. Demo: savings 10000 → 400 interest, current 5000 → 50, loan 20000 → 2200. New operations add new visitor classes like `TaxVisitor`. Trade-off: new account type updates **all** visitors. Sweet spot: **stable hierarchy, frequent new operations**. Java 21 sealed types + switch are an alternative when types change often.

## 21. Likely Interview Follow-ups

| Question | Answer sketch |
|----------|---------------|
| Double dispatch? | `accept` calls `visitor.visit(concreteType)` — resolves overload at compile time |
| Visitor vs Strategy? | Visitor: operation across **types**; Strategy: algorithm in **one** context |
| Java 21 alternative? | Sealed `Account` + `switch` on type for few operations |
| Encapsulation? | Visitor often needs internals — accept trade-off or expose read-only view |
| New account type cost? | Add `visit(NewType)` to every visitor — main downside |

**Common mistake:** Using Visitor when hierarchy changes often — every new type edits all visitors.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.visitor.AccountVisitorDemo
```
