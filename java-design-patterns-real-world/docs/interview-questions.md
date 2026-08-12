# Interview Questions

## ConfigManager

**Basic**
- What is ConfigManager? -> A way to solve many objects reload the same config file and diverge under concurrency.

**Practical**
- Where have you used it? -> Application configuration cache shared across payment services.

**Design**
- Why did you choose it? -> Lazy holder singleton with enum alternative keeps one shared config source.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentGatewayFactory

**Basic**
- What is PaymentGatewayFactory? -> A way to solve growing if/else blocks decide which gateway to instantiate.

**Practical**
- Where have you used it? -> Payment provider selection for Stripe, PayPal, and Adyen.

**Design**
- Why did you choose it? -> Factory method chooses the correct gateway from provider input.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## RegionalBankingFactory

**Basic**
- What is RegionalBankingFactory? -> A way to solve teams accidentally mix europe account rules with india payment rails.

**Practical**
- Where have you used it? -> India, Europe, and US banking packs create compatible account and payment services.

**Design**
- Why did you choose it? -> Abstract factory creates compatible service families per region.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentTransactionBuilder

**Basic**
- What is PaymentTransactionBuilder? -> A way to solve constructors with many optional fields are unreadable and error-prone.

**Practical**
- Where have you used it? -> Building a complex payment transaction request.

**Design**
- Why did you choose it? -> Builder composes required and optional fields with readable intent.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## ReportConfigurationPrototype

**Basic**
- What is ReportConfigurationPrototype? -> A way to solve template creation is expensive and hand-copying misses nested metadata.

**Practical**
- Where have you used it? -> Clone report templates for daily settlement reports.

**Design**
- Why did you choose it? -> Prototype clones a base configuration and demonstrates deep copy.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## LegacyPaymentAdapter

**Basic**
- What is LegacyPaymentAdapter? -> A way to solve the legacy provider uses incompatible request/response shapes.

**Practical**
- Where have you used it? -> Integrate a legacy bank settlement API into a modern payment interface.

**Design**
- Why did you choose it? -> Adapter translates modern payment requests to the legacy API.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## NotificationBridge

**Basic**
- What is NotificationBridge? -> A way to solve inheritance explodes when message type and provider both vary.

**Practical**
- Where have you used it? -> Email, SMS, and push notifications can run on multiple providers.

**Design**
- Why did you choose it? -> Bridge separates notification abstraction from provider implementation.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## OrderComposite

**Basic**
- What is OrderComposite? -> A way to solve client code treats bundles differently from items and duplicates traversal logic.

**Practical**
- Where have you used it? -> Orders contain single products and bundles.

**Design**
- Why did you choose it? -> Composite lets one item and many items share the same interface.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentDecorator

**Basic**
- What is PaymentDecorator? -> A way to solve a basic processor gets bloated with optional cross-cutting concerns.

**Practical**
- Where have you used it? -> Add fraud, logging, metrics, and retry around core payment processing.

**Design**
- Why did you choose it? -> Decorators layer behavior at runtime without changing the core processor.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentFacade

**Basic**
- What is PaymentFacade? -> A way to solve clients call five subsystems directly and get orchestration wrong.

**Practical**
- Where have you used it? -> One entry point orchestrates fraud, balance, audit, and notification services.

**Design**
- Why did you choose it? -> Facade exposes one simple processPayment API.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## CurrencyFlyweight

**Basic**
- What is CurrencyFlyweight? -> A way to solve repeatedly allocating the same small immutable state wastes memory.

**Practical**
- Where have you used it? -> Thousands of transactions share the same immutable currency metadata.

**Design**
- Why did you choose it? -> Flyweight shares immutable currency objects through a cache.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentServiceProxy

**Basic**
- What is PaymentServiceProxy? -> A way to solve clients call the real service without auth, logging, or rate limits.

**Practical**
- Where have you used it? -> Protect and meter access to a payment service.

**Design**
- Why did you choose it? -> Proxy controls access before delegating to the real service.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentValidationChain

**Basic**
- What is PaymentValidationChain? -> A way to solve one validator class becomes a massive list of unrelated checks.

**Practical**
- Where have you used it? -> Validation pipeline for payment requests.

**Design**
- Why did you choose it? -> Chain passes a request through dedicated validators that may reject it.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentCommand

**Basic**
- What is PaymentCommand? -> A way to solve actions are hard-coded and cannot be queued or retried uniformly.

**Practical**
- Where have you used it? -> Create, cancel, refund, and retry payments as queueable commands.

**Design**
- Why did you choose it? -> Command wraps an action and its data as an object.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## TransactionRuleInterpreter

**Basic**
- What is TransactionRuleInterpreter? -> A way to solve business analysts need simple amount/country expressions checked at runtime.

**Practical**
- Where have you used it? -> Evaluate simple AML transaction rules.

**Design**
- Why did you choose it? -> Interpreter parses and evaluates a tiny domain rule language.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## TransactionIterator

**Basic**
- What is TransactionIterator? -> A way to solve clients depend directly on repository collection choices.

**Practical**
- Where have you used it? -> Iterate transactions without exposing internal storage.

**Design**
- Why did you choose it? -> Iterator hides the collection implementation behind traversal semantics.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## OrderProcessingMediator

**Basic**
- What is OrderProcessingMediator? -> A way to solve every service talks to every other service and coupling explodes.

**Practical**
- Where have you used it? -> Order, payment, inventory, and notification services coordinate centrally.

**Design**
- Why did you choose it? -> Mediator coordinates interactions and reduces direct dependencies.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentConfigurationMemento

**Basic**
- What is PaymentConfigurationMemento? -> A way to solve teams tweak configuration and cannot easily restore the previous state.

**Practical**
- Where have you used it? -> Rollback payment config after a bad release.

**Design**
- Why did you choose it? -> Memento snapshots configuration state for rollback.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentObserver

**Basic**
- What is PaymentObserver? -> A way to solve one service manually calls every downstream listener.

**Practical**
- Where have you used it? -> Payment completion notifies notification, audit, reporting, and fraud analytics.

**Design**
- Why did you choose it? -> Observer publishes one event to many interested listeners.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentState

**Basic**
- What is PaymentState? -> A way to solve one giant switch statement allows invalid transitions.

**Practical**
- Where have you used it? -> Payment lifecycle transitions from CREATED to COMPLETED.

**Design**
- Why did you choose it? -> State objects govern valid behavior per lifecycle stage.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentStrategy

**Basic**
- What is PaymentStrategy? -> A way to solve payment method logic grows into fragile conditional blocks.

**Practical**
- Where have you used it? -> UPI, card, PayPal, and bank transfer settlement algorithms.

**Design**
- Why did you choose it? -> Strategy swaps the payment algorithm cleanly.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## PaymentProcessingTemplate

**Basic**
- What is PaymentProcessingTemplate? -> A way to solve flow is mostly the same, but small steps vary by method.

**Practical**
- Where have you used it? -> All payments follow validate/auth/process/audit/notify steps.

**Design**
- Why did you choose it? -> Template method fixes the skeleton and lets subclasses override details.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.

## AccountVisitor

**Basic**
- What is AccountVisitor? -> A way to solve adding interest, tax, and audit logic bloats account classes.

**Practical**
- Where have you used it? -> Savings, current, and loan accounts support new reporting operations.

**Design**
- Why did you choose it? -> Visitor adds operations without changing stable account objects.

**Comparison**
- Compare it with neighboring patterns based on creation vs behavior vs structure pressure.

**Senior-level**
- What are the trade-offs? -> Extra indirection is only worth it when extension or isolation pressure is real.
- How would you make it thread-safe? -> Guard shared mutable state or prefer immutability.
- Would you use it in production? -> Yes when the production problem matches the pattern, not by default.
