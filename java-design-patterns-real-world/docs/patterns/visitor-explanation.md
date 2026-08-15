# Visitor — Interview Explanation Board

> **Demo:** `AccountVisitorDemo` — `src/main/java/com/example/designpatterns/behavioral/visitor/AccountVisitorDemo.java`

## 1. Pattern Identification

| Field | Value |
|-------|-------|
| **Name** | Visitor |
| **Category** | Behavioral |
| **One-line definition** | Represent an operation to perform on elements of an object structure; lets you define new operations without changing the element classes. |
| **Problem class** | New operations (interest, tax, fees) require editing every account type class. |

## 2. Problem We Are Solving

Bank has `SavingsAccount`, `CurrentAccount`, `LoanAccount`. Interest calculation uses different rates (4%, 1%, 11%). Adding "annual fee" or "tax report" means editing all three account classes — they swell with unrelated reporting methods.

## 3. What Happens Without the Pattern

```java
class SavingsAccount {
  double interest() { ... }
  double annualFee() { ... }  // pollutes account
  double tax() { ... }
}
// repeat per account type
```

Pains: account classes bloated, new operation touches every type, poor separation of reporting from core account.

## 4. How the Pattern Solves It

1. **Element** — `Account` with `accept(AccountVisitor<T> visitor)`
2. **Concrete elements** — `SavingsAccount`, `CurrentAccount`, `LoanAccount`
3. **Visitor** — `AccountVisitor<T>` with `visit` per concrete type
4. **Concrete visitor** — `InterestCalculationVisitor` implements type-specific math
5. **Double dispatch** — `account.accept(visitor)` → `visitor.visit(this)`

## 5. Pattern → Code Mapping

| Role | Demo type | Why |
|------|-----------|-----|
| **Element** | `Account` | `accept(visitor)` |
| **Concrete elements** | `SavingsAccount`, `CurrentAccount`, `LoanAccount` | Account types |
| **Visitor** | `AccountVisitor<T>` | Visit overloads per type |
| **Concrete visitor** | `InterestCalculationVisitor` | Interest rates per type |
| **Client** | `AccountVisitorDemo.run()` | accept(visitor) on each account |

## 6. Important Code Lines

| Code | Significance |
|------|--------------|
| `SavingsAccount.accept(visitor)` → `visitor.visit(this)` | Double dispatch entry |
| `visit(SavingsAccount)` → `balance * 0.04` | Type-specific logic external |
| `visit(CurrentAccount)` → `balance * 0.01` | Different rate without editing account |
| `visit(LoanAccount)` → `principal * 0.11` | Loan uses principal |
| Generic `AccountVisitor<T>` | Visit returns `Double` interest |

## 7. Object/Class Diagram

```text
Account (element)
  accept(visitor)
      ▲
      ├── SavingsAccount
      ├── CurrentAccount
      └── LoanAccount

InterestCalculationVisitor (visitor)
  visit(SavingsAccount)
  visit(CurrentAccount)
  visit(LoanAccount)
```

## 8. Runtime Execution Flow

```text
savings = SavingsAccount(10000)
current = CurrentAccount(5000)
loan = LoanAccount(20000)
visitor = InterestCalculationVisitor()

savings.accept(visitor)
  → visitor.visit(savings) → 10000 * 0.04 = 400.0

current.accept(visitor) → 5000 * 0.01 = 50.0
loan.accept(visitor) → 20000 * 0.11 = 2200.0
```

New `TaxVisitor` adds tax without editing account classes.

## 9. What the Client Doesn't Need to Know

- Which `visit` overload runs
- Interest rates inside visitor
- That double dispatch occurred

## 10. Before vs After

**Before:** Each account class has interest(), tax(), fee() methods.

**After:** Accounts only `accept(visitor)`; operations live in visitor classes.

## 11. SOLID / Design Principles

| Principle | Application |
|-----------|-------------|
| **OCP** | New visitor for new operation |
| **Trade-off** | New **account type** updates **all** visitors |

## 12. Extensibility

- `AnnualFeeVisitor`, `TaxReportVisitor` — new classes only
- New account type: update every visitor's `visit` overload
- Prefer when **operations frequent**, **types stable**

## 13. Advantages

- Add operations without editing elements
- Related operations grouped in one visitor
- Clean account domain models

## 14. Disadvantages

- New element type breaks all visitors
- Breaking encapsulation — visitor needs internal fields (balance, principal)
- Many visit methods for large hierarchies
- Modern Java: sealed types + pattern matching alternative

## 15. When to Use

1. Interest/tax/fee ops over stable account hierarchy
2. Compiler AST passes (compile, optimize, print)
3. Document export (HTML, PDF) over same structure

## 16. When NOT to Use

1. Account types change often — sealed switch may be simpler
2. Single operation — method on element OK

## 17. Edge Cases / Production Concerns

| Concern | Note |
|---------|------|
| Encapsulation | Visitor needs element internals — document |
| Null visitor | Reject in accept() |
| Collections | Iterate accounts, accept same visitor |
| Performance | Virtual calls per accept — usually fine |

## 18. Possible Code Improvements

**Required:** Null-safe accept; document visitor contract.

**Optional:** Sealed `Account` + pattern match for simpler Java 21 code when ops rare.

## 19. Mental Model

**"Inspector touring building types."** Same inspector, different checklist per room type — rooms don't list every inspection themselves.

## 20. 30–60 Second Interview Answer

> Visitor adds operations on a stable object structure without changing element classes. Interest calculation needs different math per Savings, Current, and Loan account — adding annual fee would edit every account class. Each account `accept(visitor)` double-dispatches to `visitor.visit(this)`. `InterestCalculationVisitor` implements visit overloads: savings 4%, current 1%, loan 11% on principal. Demo: savings 10000 → 400 interest. New operations add new visitor classes. Trade-off: new account type updates all visitors. Stable structure + frequent new ops = Visitor sweet spot.

## 21. Likely Interview Follow-ups

| Question | Answer |
|----------|--------|
| Double dispatch? | accept calls visitor.visit(concreteType) — resolves overload |
| Visitor vs Strategy? | Visitor: op across types; Strategy: algorithm in one context |
| Java 21 alternative? | Sealed Account + switch on type for few operations |

**Common mistake:** Using Visitor when hierarchy changes often — every new type edits all visitors.

---

## Run

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.visitor.AccountVisitorDemo
```
