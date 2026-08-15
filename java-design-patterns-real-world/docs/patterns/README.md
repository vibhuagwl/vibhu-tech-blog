# Design Pattern Explanation Boards

Interview-oriented **problem-first** boards for every GoF demo in this repo. Each file follows the 21-section structure in [`PATTERN_EXPLANATION_FORMAT.md`](../PATTERN_EXPLANATION_FORMAT.md) and maps roles to **actual nested types** in `*Demo.java`.

**Gold standard depth:** [`composite-explanation.md`](composite-explanation.md)

## Creational

| Pattern | Demo | Explanation board |
|---------|------|-------------------|
| Singleton | `ConfigManagerDemo` | [singleton-explanation.md](singleton-explanation.md) |
| Factory Method | `PaymentGatewayFactoryDemo` | [factory-method-explanation.md](factory-method-explanation.md) |
| Abstract Factory | `RegionalBankingFactoryDemo` | [abstract-factory-explanation.md](abstract-factory-explanation.md) |
| Builder | `PaymentTransactionBuilderDemo` | [builder-explanation.md](builder-explanation.md) |
| Prototype | `ReportConfigurationPrototypeDemo` | [prototype-explanation.md](prototype-explanation.md) |

## Structural

| Pattern | Demo | Explanation board |
|---------|------|-------------------|
| Adapter | `LegacyPaymentAdapterDemo` | [adapter-explanation.md](adapter-explanation.md) |
| Bridge | `NotificationBridgeDemo` | [bridge-explanation.md](bridge-explanation.md) |
| Composite | `OrderCompositeDemo` | [composite-explanation.md](composite-explanation.md) |
| Decorator | `PaymentDecoratorDemo` | [decorator-explanation.md](decorator-explanation.md) |
| Facade | `PaymentFacadeDemo` | [facade-explanation.md](facade-explanation.md) |
| Flyweight | `CurrencyFlyweightDemo` | [flyweight-explanation.md](flyweight-explanation.md) |
| Proxy | `PaymentServiceProxyDemo` | [proxy-explanation.md](proxy-explanation.md) |

## Behavioral

| Pattern | Demo | Explanation board |
|---------|------|-------------------|
| Chain of Responsibility | `PaymentValidationChainDemo` | [chain-of-responsibility-explanation.md](chain-of-responsibility-explanation.md) |
| Command | `PaymentCommandDemo` | [command-explanation.md](command-explanation.md) |
| Interpreter | `TransactionRuleInterpreterDemo` | [interpreter-explanation.md](interpreter-explanation.md) |
| Iterator | `TransactionIteratorDemo` | [iterator-explanation.md](iterator-explanation.md) |
| Mediator | `OrderProcessingMediatorDemo` | [mediator-explanation.md](mediator-explanation.md) |
| Memento | `PaymentConfigurationMementoDemo` | [memento-explanation.md](memento-explanation.md) |
| Observer | `PaymentObserverDemo` | [observer-explanation.md](observer-explanation.md) |
| State | `PaymentStateDemo` | [state-explanation.md](state-explanation.md) |
| Strategy | `PaymentStrategyDemo` | [strategy-explanation.md](strategy-explanation.md) |
| Template Method | `PaymentProcessingTemplateDemo` | [template-method-explanation.md](template-method-explanation.md) |
| Visitor | `AccountVisitorDemo` | [visitor-explanation.md](visitor-explanation.md) |

## Related docs

| Doc | Purpose |
|-----|---------|
| [problem-and-solution.md](../problem-and-solution.md) | One-page catalog with links to each board |
| [PATTERN_EXPLANATION_FORMAT.md](../PATTERN_EXPLANATION_FORMAT.md) | Required 21-section house style |
| [composite-problem-solution.md](../composite-problem-solution.md) | Short redirect to Composite gold standard |

## Run any demo

```bash
cd java-design-patterns-real-world
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo
```

Replace the main class with any demo from the tables above.
