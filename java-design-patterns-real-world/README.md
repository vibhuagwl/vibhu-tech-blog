# java-design-patterns-real-world

This repository teaches GoF design patterns through small backend engineering stories that sound like real Java/Spring Boot work, not textbook diagrams.

## What this repository teaches

- all 23 GoF patterns in practical Java form
- richer examples for core interview patterns like Strategy, State, Decorator, and Facade
- a real-world payment system that combines patterns the way production systems do
- a small Kafka-style in-memory event flow
- short pattern READMEs optimized for interview revision
- tests that verify behavior, not empty object creation

## How to run it

```bash
cd java-design-patterns-real-world
mvn clean test
mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.DesignPatternDemo
```

## Pattern index

- Creational: Singleton, Factory Method, Abstract Factory, Builder, Prototype
- Structural: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
- Behavioral: Chain, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor

## Implementation rules (in each Demo class)

Every GoF `*Demo.java` starts with a JavaDoc block:

- **WHEN TO IMPLEMENT** — pressure that justifies the pattern
- **JAVA IMPLEMENTATION RULES** — concrete class/interface rules for Java
- **DO NOT USE WHEN** — when to keep the code simpler

Open any pattern Demo in the source explorer (for example Strategy → `PaymentStrategyDemo.java`) and read the header before the code.

## Real-world examples

- payments and gateways
- banking region packs
- Kafka-inspired event fanout
- order processing and notifications
- settlement validation and reporting

## Interview preparation path

1. Read `docs/cheatsheet.md`
2. Run `DesignPatternDemo`
3. Open the pattern README for weak areas
4. Study `realworld/payment/PaymentProcessingSystem.java`
5. Review `docs/interview-questions.md`
6. Review `docs/pattern-comparisons.md`
7. Review `docs/spring-pattern-mapping.md`

## 5-minute cheat sheet

See `docs/cheatsheet.md`.

## Senior-level pattern combinations

See `docs/pattern-combinations.md` and `src/main/java/com/example/designpatterns/realworld/payment/PaymentProcessingSystem.java`.
