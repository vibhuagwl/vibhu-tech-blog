# How to run — step by step

Every GoF `*Demo.java` (plus Kafka and the combined payment system) is a **full working program**: it has `run()` with numbered STEPs and a `main` method.

## Prerequisites

1. **JDK 17+** installed (`java -version`)
2. **Maven 3.9+** installed (`mvn -version`)
3. Open a terminal in the repo folder:

```bash
cd java-design-patterns-real-world
```

## Step 1 — Run all unit tests (optional but recommended)

```bash
mvn clean test
```

You should see all pattern tests pass. This proves the demos compile and behave.

## Step 2 — Run every pattern at once (recommended first run)

```bash
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.DesignPatternDemo
```

What you will see:

1. Banner: `=== JAVA DESIGN PATTERNS — ALL DEMOS ===`
2. Each pattern prints `=== Pattern — ClassName ===`
3. Numbered `STEP 1`, `STEP 2`, … explaining what the code does
4. Live results of that pattern
5. Final line: `ALL DEMOS COMPLETE`

Order: Creational → Structural → Behavioral → Kafka flow → Combined payment system.

## Step 3 — Run one pattern alone

Pick any Demo class. Examples:

```bash
# Factory Method
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.creational.factory.PaymentGatewayFactoryDemo

# Strategy
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.behavioral.strategy.PaymentStrategyDemo

# Decorator
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.structural.decorator.PaymentDecoratorDemo

# Combined payment system
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.realworld.payment.PaymentProcessingSystem

# Kafka-style event flow
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.realworld.kafka.KafkaEventFlowDemo
```

## Step 4 — Read the code in the blog explorer

On the site page [Java design patterns — real world](/java-design-patterns-real-world/):

1. Open `docs/HOW_TO_RUN.md` (this file)
2. Open `DesignPatternDemo.java` — orchestrator `main`
3. Open any `*Demo.java` — scroll to `run()` / `main()` at the bottom
4. Read the JavaDoc header first: **WHEN TO IMPLEMENT** / **JAVA IMPLEMENTATION RULES**

## Step 5 — Interview drill

1. Run one weak pattern’s `main` and explain each STEP out loud
2. Open that pattern’s folder `README.md` (if present) or `docs/cheatsheet.md`
3. Study `realworld/payment/PaymentProcessingSystem.java` for pattern combination
4. Compare similar patterns in `docs/pattern-comparisons.md`

## IDE (IntelliJ / VS Code)

1. Open `java-design-patterns-real-world` as a Maven project
2. Right-click `DesignPatternDemo.java` → **Run 'DesignPatternDemo.main()'**
3. Or open any `*Demo.java` and run its `main`

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `exec:java` class not found | Run from `java-design-patterns-real-world/` after `mvn compile` |
| Wrong Java version | Project targets modern JDK — use 17+ |
| Tests fail after edits | Revert accidental API changes in nested types used by tests |

## Catalog of mains

| Area | Main class |
|------|------------|
| All patterns | `com.example.designpatterns.DesignPatternDemo` |
| Singleton | `...creational.singleton.ConfigManagerDemo` |
| Factory Method | `...creational.factory.PaymentGatewayFactoryDemo` |
| Abstract Factory | `...creational.abstractfactory.RegionalBankingFactoryDemo` |
| Builder | `...creational.builder.PaymentTransactionBuilderDemo` |
| Prototype | `...creational.prototype.ReportConfigurationPrototypeDemo` |
| Adapter | `...structural.adapter.LegacyPaymentAdapterDemo` |
| Bridge | `...structural.bridge.NotificationBridgeDemo` |
| Composite | `...structural.composite.OrderCompositeDemo` |
| Decorator | `...structural.decorator.PaymentDecoratorDemo` |
| Facade | `...structural.facade.PaymentFacadeDemo` |
| Flyweight | `...structural.flyweight.CurrencyFlyweightDemo` |
| Proxy | `...structural.proxy.PaymentServiceProxyDemo` |
| Chain of Responsibility | `...behavioral.chainofresponsibility.PaymentValidationChainDemo` |
| Command | `...behavioral.command.PaymentCommandDemo` |
| Interpreter | `...behavioral.interpreter.TransactionRuleInterpreterDemo` |
| Iterator | `...behavioral.iterator.TransactionIteratorDemo` |
| Mediator | `...behavioral.mediator.OrderProcessingMediatorDemo` |
| Memento | `...behavioral.memento.PaymentConfigurationMementoDemo` |
| Observer | `...behavioral.observer.PaymentObserverDemo` |
| State | `...behavioral.state.PaymentStateDemo` |
| Strategy | `...behavioral.strategy.PaymentStrategyDemo` |
| Template Method | `...behavioral.templatemethod.PaymentProcessingTemplateDemo` |
| Visitor | `...behavioral.visitor.AccountVisitorDemo` |
| Kafka flow | `...realworld.kafka.KafkaEventFlowDemo` |
| Combined payment | `...realworld.payment.PaymentProcessingSystem` |
