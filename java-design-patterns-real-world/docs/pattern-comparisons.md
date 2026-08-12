# Pattern Comparisons

## Strategy vs State

| Topic | Strategy | State |
|---|---|---|
| Main pressure | many algorithms | one lifecycle with changing behavior |
| Selection | caller or router chooses implementation | object changes implementation as state changes |
| Example here | payment method choice | payment lifecycle transitions |
| Interview sentence | swap the algorithm | behavior changes because lifecycle changed |

Use Strategy when you say: *"UPI, card, PayPal all solve the same operation differently."*

Use State when you say: *"A payment can authorize, capture, settle, or fail depending on where it is in its lifecycle."*

## Decorator vs Proxy

| Topic | Decorator | Proxy |
|---|---|---|
| Main pressure | add behavior dynamically | control access to target |
| Client intent | enrich the original behavior | protect or intercept before real call |
| Example here | logging, metrics, retry around payment processing | auth/cache/rate-limit around payment service |
| Typical question | what extra behavior do I want? | what control do I need before the call? |

Use Decorator when the base feature is correct but needs more layers.

Use Proxy when the target should not be reached directly.

## Facade vs Adapter

| Topic | Facade | Adapter |
|---|---|---|
| Main pressure | too many subsystem calls | incompatible interface |
| Client view | one simple entry point | same expected interface, translated internally |
| Example here | `PaymentFacade` orchestrates fraud, account, audit, notify | legacy payment API wrapped as modern interface |
| Key phrase | simplify | translate |

Use Facade when clients are overwhelmed by orchestration.

Use Adapter when the existing API speaks the wrong language.

## Factory vs Builder

| Topic | Factory | Builder |
|---|---|---|
| Main pressure | which type to create | how to construct a complex object |
| Output variability | implementation changes | same object, many optional fields |
| Example here | choose Stripe/PayPal/Adyen gateway | build a `PaymentTransaction` cleanly |
| Key phrase | choose implementation | assemble object |

Use Factory when caller should not decide concrete class directly.

Use Builder when constructors are becoming unreadable.
