# Problem → Design pattern → How it is resolved

Use this sheet in interviews: state the **pain**, name the **pattern**, explain the **fix**. Every `*Demo.java` also prints `PROBLEM:` / `SOLUTION:` when you run `main`.

## Creational

| Pattern | Problem (without it) | How the pattern resolves it |
|--------|----------------------|-----------------------------|
| **Singleton** (`ConfigManagerDemo`) | Many services each load “their own” config → inconsistent settings, extra memory, racey reloads | One shared instance for the JVM (or carefully scoped container singleton) so everyone reads the same config |
| **Factory Method** (`PaymentGatewayFactoryDemo`) | Callers `new StripeGateway()` / `new PayPal…` everywhere; adding Adyen edits every caller | Factory returns `PaymentGateway`; callers depend on the interface; new providers change one place |
| **Abstract Factory** (`RegionalBankingFactoryDemo`) | US/EU banking needs a *family* of related objects; mixing regions creates illegal combos | Regional factory builds a consistent product family (account + statement + rules) together |
| **Builder** (`PaymentTransactionBuilderDemo`) | Telescoping constructors / optional fields → invalid half-built payment objects | Fluent builder validates and assembles a complete immutable transaction |
| **Prototype** (`ReportConfigurationPrototypeDemo`) | Rebuilding nearly identical heavy report configs from scratch is slow and error-prone | Clone a validated prototype and tweak only what differs |

## Structural

| Pattern | Problem (without it) | How the pattern resolves it |
|--------|----------------------|-----------------------------|
| **Adapter** (`LegacyPaymentAdapterDemo`) | New payment code expects a modern API; legacy bank SDK has a different shape | Adapter implements the modern interface and translates calls to the legacy SDK |
| **Bridge** (`NotificationBridgeDemo`) | Alert type × channel (email/SMS/push) explodes into N×M subclasses | Split abstraction (notification) from implementation (channel) and compose them |
| **Composite** (`OrderCompositeDemo`) | Code treats single products and bundles differently for pricing | Same `Component` interface; bundles contain children; `total()` works uniformly |
| **Decorator** (`PaymentDecoratorDemo`) | Need logging, metrics, retry without editing core payment or subclass explosion | Wrap the same interface with single-purpose decorators; nest as needed |
| **Facade** (`PaymentFacadeDemo`) | Callers must orchestrate fraud + ledger + gateway themselves | Facade exposes one simple `processPayment` that hides the subsystem |
| **Flyweight** (`CurrencyFlyweightDemo`) | Millions of money objects each copy currency metadata | Share intrinsic currency state; keep only extrinsic amounts on each use |
| **Proxy** (`PaymentServiceProxyDemo`) | Need auth / caching / access control in front of a real service | Proxy implements the same interface and guards/delegates to the real subject |

## Behavioral

| Pattern | Problem (without it) | How the pattern resolves it |
|--------|----------------------|-----------------------------|
| **Chain of Responsibility** (`PaymentValidationChainDemo`) | One mega method with nested ifs for auth, amount, fraud | Linked validators; each handles or forwards — easy to add/reorder |
| **Command** (`PaymentCommandDemo`) | Actions (pay/refund) are hard to queue, audit, or undo as plain method calls | Encapsulate each action as a command object with `execute` (and undo if needed) |
| **Interpreter** (`TransactionRuleInterpreterDemo`) | Hard-coding every rule combination in Java branches | Parse/evaluate a small rule language as an expression tree |
| **Iterator** (`TransactionIteratorDemo`) | Clients dig into list/map storage details to walk history | Iterator hides storage; client only uses `hasNext` / `next` |
| **Mediator** (`OrderProcessingMediatorDemo`) | Inventory, payment, shipping call each other → spaghetti | Colleagues talk only to a mediator that coordinates the workflow |
| **Memento** (`PaymentConfigurationMementoDemo`) | Need undo/restore of config without exposing internals | Snapshot opaque state; caretaker stores mementos; originator restores |
| **Observer** (`PaymentObserverDemo`) | Publisher hard-codes every listener (email, audit, metrics) | Event bus notifies registered observers; add listeners without editing publisher |
| **State** (`PaymentStateDemo`) | Payment lifecycle flags + illegal ops in wrong phase | Explicit state objects; transitions enforce legal moves (authorize → capture → …) |
| **Strategy** (`PaymentStrategyDemo`) | Giant switch on UPI/CARD/PayPal inside one service | Interchangeable strategy classes; context dispatches by method |
| **Template Method** (`PaymentProcessingTemplateDemo`) | Same payment pipeline steps, varying details → copy-paste flows | Abstract template fixes the order; subclasses override hooks |
| **Visitor** (`AccountVisitorDemo`) | New operations on many account types force editing every account class | Visitor adds operations externally; accounts accept visitors (double dispatch) |

## Real-world combinations

| Example | Problem | Resolution |
|--------|---------|------------|
| **Kafka event flow** | After payment, many side effects (notify, audit) tightly coupled to the producer | Publish event once; in-memory consumers react independently (Observer-like) |
| **PaymentProcessingSystem** | Real payments need several patterns at once without a god class | Facade + Strategy + validation chain (+ others) composed behind one entry point |

## How to practice

1. Open any `*Demo.java` — read **PROBLEM** / **HOW THIS PATTERN SOLVES IT** in the JavaDoc.
2. Run it and watch the printed `PROBLEM:` / `SOLUTION:` lines, then the STEPs:

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo
```

3. Explain out loud: *“The problem was X; Strategy resolves it by Y.”*
