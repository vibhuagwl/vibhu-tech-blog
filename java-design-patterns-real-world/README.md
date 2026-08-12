# java-design-patterns-real-world

This repository teaches GoF design patterns through small backend engineering stories that sound like real Java/Spring Boot work, not textbook diagrams.

## What this repository teaches

- all 23 GoF patterns in practical Java form
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

## 5-minute cheat sheet

See `docs/cheatsheet.md`.

## Senior-level pattern combinations

See `docs/pattern-combinations.md` and `src/main/java/com/example/designpatterns/realworld/payment/PaymentProcessingSystem.java`.
