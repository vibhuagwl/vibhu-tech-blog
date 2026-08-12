# Cheat Sheet

| Pattern | Remember As | Real Problem | Java Example | Key Question |
|---|---|---|---|---|
| Singleton | One | One shared instance | ConfigManager | Do I really need one instance? |
| Factory Method | Create | Object creation varies | PaymentGatewayFactory | Who decides implementation? |
| Abstract Factory | Family | Related objects | RegionalBankingFactory | Need compatible object families? |
| Builder | Build | Complex object | PaymentTransaction | Too many constructor parameters? |
| Prototype | Clone | Expensive object creation | ReportConfiguration | Can I copy instead? |
| Adapter | Translate | Incompatible APIs | LegacyPaymentAdapter | Need old API to fit new interface? |
| Bridge | Separate | Two dimensions vary | Notification + Provider | Avoid class explosion? |
| Composite | Tree | Part-whole hierarchy | OrderBundle | Treat one and many uniformly? |
| Decorator | Add | Runtime behavior | PaymentLoggingDecorator | Add behavior without modifying class? |
| Facade | Simplify | Too many subsystem calls | PaymentFacade | Can client use one simple API? |
| Flyweight | Share | Too many similar objects | CurrencyMetadata | Can immutable state be shared? |
| Proxy | Control | Access around object | PaymentServiceProxy | Need security/cache/logging? |
| Chain | Pipeline | Sequential validation | PaymentValidators | Multiple handlers may reject? |
| Command | Request as object | Undo/queue/retry | RefundCommand | Need queue/retry/undo? |
| Interpreter | Rules | Simple language | PaymentRule | Need evaluate business expressions? |
| Iterator | Traverse | Hide collection | TransactionRepository | Traverse without exposing internals? |
| Mediator | Centralize | Too much communication | OrderMediator | Too many objects talking directly? |
| Memento | Snapshot | Restore state | ConfigSnapshot | Need rollback? |
| Observer | Notify | One-to-many events | PaymentEvent | Many listeners react to one event? |
| State | Lifecycle | Behavior changes by state | PaymentState | Same object behaves differently by state? |
| Strategy | Swap algorithm | Multiple algorithms | PaymentStrategy | Algorithm varies independently? |
| Template Method | Skeleton | Same workflow | PaymentProcessor | Workflow same, steps differ? |
| Visitor | Operation | Stable object structure | AccountVisitor | Add operations without changing objects? |

## If-this-then-pattern

IF OBJECT CREATION IS COMPLEX -> Builder
IF OBJECT TYPE CHANGES -> Factory Method
IF RELATED OBJECTS MUST BE CREATED TOGETHER -> Abstract Factory
IF API DOES NOT MATCH -> Adapter
IF YOU WANT TO ADD BEHAVIOR AT RUNTIME -> Decorator
IF YOU WANT ONE SIMPLE ENTRY POINT -> Facade
IF ACCESS MUST BE CONTROLLED -> Proxy
IF MULTIPLE VALIDATORS PROCESS A REQUEST -> Chain
IF ALGORITHM CHANGES -> Strategy
IF OBJECT BEHAVIOR CHANGES WITH STATE -> State
IF ONE EVENT HAS MANY LISTENERS -> Observer
IF OBJECTS TALK TOO MUCH -> Mediator
IF OPERATION MUST BE QUEUED/RETRIED/UNDONE -> Command
IF WORKFLOW IS FIXED BUT STEPS VARY -> Template Method
IF STATE MUST BE RESTORED -> Memento
IF YOU HAVE A TREE -> Composite
IF YOU NEED TO SHARE MANY SMALL IMMUTABLE OBJECTS -> Flyweight