# Spring Pattern Mapping

This document explains the practical relationship between Spring Boot and design patterns without pretending every framework feature is literally one pattern.

## Singleton -> Spring bean scope

`@Service`, `@Component`, and `@Repository` beans are singleton-scoped by default inside one application context.

Practical meaning:
- one `PaymentService` bean is reused across requests
- the container handles lifecycle and dependency wiring
- thread safety still matters if the bean holds mutable state

Use this repository to compare:
- `creational/singleton/ConfigManagerDemo`
- stateless service beans in real Spring apps

## Factory -> BeanFactory / auto-configuration / bean methods

Spring often hides object creation behind factories:
- `BeanFactory`
- `@Bean` methods
- auto-configuration classes deciding which implementation to instantiate

Practical example:
- selecting an HTTP client bean by environment
- selecting a payment gateway implementation by config property

Repository tie-in:
- `creational/factory/PaymentGatewayFactoryDemo`

## Strategy -> dependency injection with multiple implementations

Spring commonly uses strategy-like composition when several beans implement one interface and the app chooses one by qualifier, profile, property, or registry map.

Practical example:
- `CardPaymentStrategy`
- `UpiPaymentStrategy`
- `PaypalPaymentStrategy`

Repository tie-in:
- `behavioral/strategy/PaymentStrategyDemo`

## Adapter -> third-party client wrapping

Spring code often wraps old SDKs or external APIs so the rest of the app sees one clean internal interface.

Practical example:
- wrapping a legacy bank SDK behind `PaymentGateway`
- adapting vendor-specific auth headers or payload formats

Repository tie-in:
- `structural/adapter/LegacyPaymentAdapterDemo`
- `realworld/payment/PaymentProcessingSystem`

## Proxy -> Spring AOP / transactions / security / lazy beans

Spring creates proxies around beans for:
- `@Transactional`
- method security
- AOP advice
- lazy initialization

Important nuance:
- the proxy is not the business object itself
- self-invocation can bypass proxy advice in common Spring setups

Repository tie-in:
- `structural/proxy/PaymentServiceProxyDemo`

## Chain of Responsibility -> filter chains and interceptors

Spring Security and servlet filters are strong practical chain examples:
- one request moves through ordered handlers
- each handler may reject, mutate, or continue

Practical examples:
- auth filter
- token validation filter
- authorization filter

Repository tie-in:
- `behavioral/chainofresponsibility/PaymentValidationChainDemo`

## Observer -> ApplicationEventPublisher and async listeners

One event can trigger many listeners:
- audit
- notification
- reporting
- analytics

In Spring:
- `ApplicationEventPublisher`
- `@EventListener`
- async listeners
- Kafka consumers as distributed observers

Repository tie-in:
- `behavioral/observer/PaymentObserverDemo`
- `realworld/kafka/KafkaEventFlowDemo`

## Template Method -> fixed framework workflow with overridable steps

Spring abstractions often provide a stable execution skeleton while specific hooks vary.

Examples:
- support classes
- transaction templates
- some security/authentication flows
- batch/job step templates

Repository tie-in:
- `behavioral/templatemethod/PaymentProcessingTemplateDemo`

## Facade -> service orchestration layer

A Spring facade is often just a service class that gives controllers one business entry point while hiding internal orchestration.

Repository tie-in:
- `structural/facade/PaymentFacadeDemo`
- `realworld/payment/PaymentProcessingSystem`

## State vs Strategy in Spring code

- **Strategy**: choose one implementation from many
- **State**: one object changes behavior as its lifecycle changes

Spring DI helps strategy selection, but lifecycle/state transitions are usually explicit domain logic.

## Decorator vs Proxy in Spring code

- **Decorator** adds business behavior composition deliberately
- **Proxy** controls or intercepts access, often framework-created

A Spring AOP transaction proxy is closer to Proxy than Decorator.
