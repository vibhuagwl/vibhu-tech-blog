# Problem → Design pattern → How it is resolved

Use this sheet in interviews: state the **pain**, name the **pattern**, explain the **fix**. Every `*Demo.java` also prints `PROBLEM:` / `SOLUTION:` when you run `main`.

**Full boards:** each pattern links to a 21-section explanation in [`docs/patterns/`](patterns/README.md).

## Creational

| Pattern | Problem (without it) | How the pattern resolves it | Explanation board |
|--------|----------------------|-----------------------------|-------------------|
| **Singleton** (`ConfigManagerDemo`) | Many services each load “their own” config → inconsistent settings, extra memory, racey reloads | One shared instance for the JVM (or carefully scoped container singleton) so everyone reads the same config | [singleton-explanation.md](patterns/singleton-explanation.md) |
| **Factory Method** (`PaymentGatewayFactoryDemo`) | Callers `new StripeGateway()` / `new PayPal…` everywhere; adding Adyen edits every caller | Factory returns `PaymentGateway`; callers depend on the interface; new providers change one place | [factory-method-explanation.md](patterns/factory-method-explanation.md) |
| **Abstract Factory** (`RegionalBankingFactoryDemo`) | US/EU banking needs a *family* of related objects; mixing regions creates illegal combos | Regional factory builds a consistent product family (account + statement + rules) together | [abstract-factory-explanation.md](patterns/abstract-factory-explanation.md) |
| **Builder** (`PaymentTransactionBuilderDemo`) | Telescoping constructors / optional fields → invalid half-built payment objects | Fluent builder validates and assembles a complete immutable transaction | [builder-explanation.md](patterns/builder-explanation.md) |
| **Prototype** (`ReportConfigurationPrototypeDemo`) | Rebuilding nearly identical heavy report configs from scratch is slow and error-prone | Clone a validated prototype and tweak only what differs | [prototype-explanation.md](patterns/prototype-explanation.md) |

## Structural

| Pattern | Problem (without it) | How the pattern resolves it | Explanation board |
|--------|----------------------|-----------------------------|-------------------|
| **Adapter** (`LegacyPaymentAdapterDemo`) | New payment code expects a modern API; legacy bank SDK has a different shape | Adapter implements the modern interface and translates calls to the legacy SDK | [adapter-explanation.md](patterns/adapter-explanation.md) |
| **Bridge** (`NotificationBridgeDemo`) | Alert type × channel (email/SMS/push) explodes into N×M subclasses | Split abstraction (notification) from implementation (channel) and compose them | [bridge-explanation.md](patterns/bridge-explanation.md) |
| **Composite** (`OrderCompositeDemo`) | Client uses `instanceof` + nested loops to total products vs bundles vs nested bundles | Common `OrderComponent`; Bundle recursively sums children — client only calls `total()` | [composite-explanation.md](patterns/composite-explanation.md) |
| **Decorator** (`PaymentDecoratorDemo`) | Need logging, metrics, retry without editing core payment or subclass explosion | Wrap the same interface with single-purpose decorators; nest as needed | [decorator-explanation.md](patterns/decorator-explanation.md) |
| **Facade** (`PaymentFacadeDemo`) | Callers must orchestrate fraud + ledger + gateway themselves | Facade exposes one simple `processPayment` that hides the subsystem | [facade-explanation.md](patterns/facade-explanation.md) |
| **Flyweight** (`CurrencyFlyweightDemo`) | Millions of money objects each copy currency metadata | Share intrinsic currency state; keep only extrinsic amounts on each use | [flyweight-explanation.md](patterns/flyweight-explanation.md) |
| **Proxy** (`PaymentServiceProxyDemo`) | Need auth / caching / access control in front of a real service | Proxy implements the same interface and guards/delegates to the real subject | [proxy-explanation.md](patterns/proxy-explanation.md) |

## Behavioral

| Pattern | Problem (without it) | How the pattern resolves it | Explanation board |
|--------|----------------------|-----------------------------|-------------------|
| **Chain of Responsibility** (`PaymentValidationChainDemo`) | One mega method with nested ifs for auth, amount, fraud | Linked validators; each handles or forwards — easy to add/reorder | [chain-of-responsibility-explanation.md](patterns/chain-of-responsibility-explanation.md) |
| **Command** (`PaymentCommandDemo`) | Actions (pay/refund) are hard to queue, audit, or undo as plain method calls | Encapsulate each action as a command object with `execute` (and undo if needed) | [command-explanation.md](patterns/command-explanation.md) |
| **Interpreter** (`TransactionRuleInterpreterDemo`) | Hard-coding every rule combination in Java branches | Parse/evaluate a small rule language as an expression tree | [interpreter-explanation.md](patterns/interpreter-explanation.md) |
| **Iterator** (`TransactionIteratorDemo`) | Clients dig into list/map storage details to walk history | Iterator hides storage; client only uses `hasNext` / `next` | [iterator-explanation.md](patterns/iterator-explanation.md) |
| **Mediator** (`OrderProcessingMediatorDemo`) | Inventory, payment, shipping call each other → spaghetti | Colleagues talk only to a mediator that coordinates the workflow | [mediator-explanation.md](patterns/mediator-explanation.md) |
| **Memento** (`PaymentConfigurationMementoDemo`) | Need undo/restore of config without exposing internals | Snapshot opaque state; caretaker stores mementos; originator restores | [memento-explanation.md](patterns/memento-explanation.md) |
| **Observer** (`PaymentObserverDemo`) | Publisher hard-codes every listener (email, audit, metrics) | Event bus notifies registered observers; add listeners without editing publisher | [observer-explanation.md](patterns/observer-explanation.md) |
| **State** (`PaymentStateDemo`) | Payment lifecycle flags + illegal ops in wrong phase | Explicit state objects; transitions enforce legal moves (authorize → capture → …) | [state-explanation.md](patterns/state-explanation.md) |
| **Strategy** (`PaymentStrategyDemo`) | Giant switch on UPI/CARD/PayPal inside one service | Interchangeable strategy classes; context dispatches by method | [strategy-explanation.md](patterns/strategy-explanation.md) |
| **Template Method** (`PaymentProcessingTemplateDemo`) | Same payment pipeline steps, varying details → copy-paste flows | Abstract template fixes the order; subclasses override hooks | [template-method-explanation.md](patterns/template-method-explanation.md) |
| **Visitor** (`AccountVisitorDemo`) | New operations on many account types force editing every account class | Visitor adds operations externally; accounts accept visitors (double dispatch) | [visitor-explanation.md](patterns/visitor-explanation.md) |

## Real-world combinations

| Example | Problem | Resolution |
|--------|---------|------------|
| **Kafka event flow** | After payment, many side effects (notify, audit) tightly coupled to the producer | Publish event once; in-memory consumers react independently (Observer-like) |
| **PaymentProcessingSystem** | Real payments need several patterns at once without a god class | Facade + Strategy + validation chain (+ others) composed behind one entry point |

## How to practice

1. Open any `*Demo.java` — read **PROBLEM** / **HOW THIS PATTERN SOLVES IT** in the JavaDoc.
2. Open the matching board in `docs/patterns/<pattern>-explanation.md` for the full 21-section walkthrough.
3. Run it and watch the printed `PROBLEM:` / `SOLUTION:` lines, then the STEPs:

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo
```

4. Explain out loud: *“The problem was X; Strategy resolves it by Y.”*
