/** Problem-first GoF playbook — FinTech payment domain.
 *  Don't memorize the pattern. Remember the problem. */

export type Family = 'Creational' | 'Structural' | 'Behavioral';

export type PatternStory = {
  id: string;
  name: string;
  family: Family;
  /** Primary revision memory */
  rememberProblem: string;
  story: string;
  badCode: string;
  pain: string;
  diagram: string;
  goodCode: string;
  how: string;
  when: string;
  whenNot: string;
  recognize: string;
  memory: string;
};

export const PHILOSOPHY =
  "Don't memorize Design Patterns. Memorize the problem they solve. When you recognize the problem, the pattern becomes obvious.";

export const FAMILY_MEMORY = `CREATIONAL  = How do I CREATE objects?     (C = CREATE)
STRUCTURAL  = How do I CONNECT / COMPOSE?  (S = STRUCTURE)
BEHAVIORAL  = How do objects COMMUNICATE?  (B = BEHAVIOR)`;

export const MASTER_MAP = `DESIGN PATTERNS
│
├── CREATIONAL — How do I CREATE objects?
│   ├── Singleton · Factory · Abstract Factory
│   ├── Builder · Prototype
│
├── STRUCTURAL — How do I CONNECT objects?
│   ├── Adapter · Decorator · Facade · Proxy
│   ├── Composite · Bridge · Flyweight
│
└── BEHAVIORAL — How do objects BEHAVE?
    ├── Strategy · Observer · Chain · Command
    ├── Template Method · State · Iterator
    ├── Mediator · Memento · Visitor · Interpreter`;

export const PAYMENT_DOMAIN = `                    Payment Platform
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          Payments      Refunds       Notifications
             │
      ┌──────┼──────┐
      │      │      │
     UPI    CARD   BANK`;

export const PROBLEM_TABLE: [string, string, string][] = [
  ['Factory', 'Object creation pattern', 'Which payment implementation should I create?'],
  ['Strategy', 'Encapsulate algorithms', 'Fee/routing calculation changes by type.'],
  ['Builder', 'Complex object creation', 'Too many constructor parameters.'],
  ['Adapter', 'Interface compatibility', "Old bank API doesn't match our interface."],
  ['Decorator', 'Add behavior dynamically', 'Add logging/metrics without changing class.'],
  ['Facade', 'Simplify subsystem', "Client shouldn't know 10 services."],
  ['Proxy', 'Control access', 'Need caching / security / lazy loading.'],
  ['Observer', 'Notify many objects', 'When payment succeeds, notify everyone.'],
  ['Chain', 'Pass request through handlers', 'Try validation rules one by one.'],
  ['Command', 'Encapsulate request', 'Need queue / retry / undo a request.'],
  ['State', 'Behavior changes by state', 'Payment behaves differently in CREATED/PAID/FAILED.'],
  ['Template Method', 'Same workflow, varying steps', 'Algorithm fixed but some steps differ.'],
  ['Singleton', 'One instance', 'One shared config / holiday calendar / cache.'],
  ['Abstract Factory', 'Family of products', 'India pack vs Europe pack of related objects.'],
  ['Flyweight', 'Share immutable state', '100M txns share currency/country objects.'],
  ['Composite', 'Tree of objects', 'Bank → Region → Branch — same calculateTotal().'],
  ['Bridge', 'Two independent axes', 'Payment type × provider without combinatorial classes.'],
  ['Prototype', 'Clone template', 'Clone standing instruction instead of rebuild.'],
  ['Memento', 'Snapshot/restore', 'Save fee config and undo a bad change.'],
  ['Iterator', 'Traverse collection', 'Walk transactions without exposing storage.'],
  ['Mediator', 'Centralize talk', 'Stop every service calling every other service.'],
  ['Visitor', 'New ops on stable structure', 'Add tax/audit reports without editing Payment types.'],
  ['Interpreter', 'Tiny rule language', 'Evaluate “amount > 50k AND new payee → OTP”.'],
];

export const PATTERN_STORIES: PatternStory[] = [
  {
    id: 'factory-method',
    name: 'Factory',
    family: 'Creational',
    rememberProblem: 'Which payment implementation should I create?',
    story: 'Payment service supports Card, UPI, and Bank Transfer. Caller should not `new` concretes.',
    badCode: `if (type.equals("CARD")) {
  payment = new CardPayment();
} else if (type.equals("UPI")) {
  payment = new UpiPayment();
} else if (type.equals("BANK")) {
  payment = new BankPayment();
}`,
    pain: `New payment method
      ↓
Modify existing code
      ↓
More if/else
      ↓
Risk increases`,
    diagram: `             PaymentFactory
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      Card         UPI       Bank`,
    goodCode: `interface Payment { void pay(BigDecimal amount); }

class PaymentFactory {
  static Payment create(String type) {
    return switch (type) {
      case "CARD" -> new CardPayment();
      case "UPI"  -> new UpiPayment();
      case "BANK" -> new BankPayment();
      default -> throw new IllegalArgumentException(type);
    };
  }
}`,
    how: 'Caller asks for a Payment by type; factory returns the concrete implementation behind the interface.',
    when: 'Many implementations + creation logic + caller must not know concrete class.',
    whenNot: 'Only one implementation forever; or algorithm swap (use Strategy).',
    recognize: `Many implementations
        +
Object creation logic
        +
Caller shouldn't know concrete class
        ↓
Factory`,
    memory: 'Factory = "You tell me WHAT you want; I decide WHICH object to create."',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    family: 'Behavioral',
    rememberProblem: 'Same job, different algorithm (fee/routing by type).',
    story: 'Payment fee calculation changes based on payment type / corridor.',
    badCode: `if (type.equals("UPI")) { ... }
else if (type.equals("CARD")) { ... }
else if (type.equals("INTERNATIONAL")) { ... }`,
    pain: `Algorithm keeps changing
        ↓
Huge if/else
        ↓
Hard to test`,
    diagram: `              PaymentService
                    │
              FeeStrategy
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
      UPI          CARD      International`,
    goodCode: `interface FeeStrategy {
  BigDecimal fee(PaymentRequest req);
}
class UpiFee implements FeeStrategy { ... }
class CardFee implements FeeStrategy { ... }

class PaymentService {
  BigDecimal total(PaymentRequest req, FeeStrategy strategy) {
    return req.amount().add(strategy.fee(req));
  }
}`,
    how: 'Inject/select an algorithm object at runtime; service stays stable.',
    when: 'Same operation, multiple algorithms, choose at runtime.',
    whenNot: 'You need to create objects (Factory) or behavior is driven by lifecycle state (State).',
    recognize: `Same operation
+ Different algorithms
+ Choose at runtime
= Strategy`,
    memory: 'Strategy = "Same job, different way of doing it."',
  },
  {
    id: 'builder',
    name: 'Builder',
    family: 'Creational',
    rememberProblem: 'Too many constructor parameters / optional fields.',
    story: 'PaymentRequest has ~12 optional fields (callback, metadata, GSTIN…).',
    badCode: `new PaymentRequest(account, amount, currency, country,
  merchant, reference, metadata, callbackUrl, ...);`,
    pain: `Too many parameters
      ↓
Constructor hell
      ↓
Hard to read`,
    diagram: `PaymentRequest.builder()
  .accountId(...)
  .amount(...)
  .currency(...)
  .build()`,
    goodCode: `PaymentRequest request = PaymentRequest.builder()
    .accountId("A123")
    .amount(BigDecimal.valueOf(1000))
    .currency("INR")
    .merchant("Amazon")
    .build();`,
    how: 'Step-by-step fluent construction; validate in build().',
    when: 'Many optionals, readable construction, immutable result.',
    whenNot: 'Simple 2–3 required fields — a record constructor is enough.',
    recognize: 'Telescoping constructors / optional soup → Builder',
    memory: 'Builder = "Too many optional ingredients? Build step-by-step."',
  },
  {
    id: 'adapter',
    name: 'Adapter',
    family: 'Structural',
    rememberProblem: "Old API doesn't match my interface.",
    story: 'We expect PaymentGateway.pay(PaymentRequest). Legacy bank gives makeTransaction(account, double).',
    badCode: `// Controllers call OldBankApi directly with double + String
BankResponse r = old.makeTransaction(acct, amount.doubleValue());`,
    pain: `Our interface
      ≠
Legacy interface`,
    diagram: `PaymentService
      │
PaymentGateway
      │
PaymentAdapter
      │
OldBankApi`,
    goodCode: `class OldBankAdapter implements PaymentGateway {
  private final OldBankApi old;
  public PaymentResponse pay(PaymentRequest req) {
    BankResponse r = old.makeTransaction(
        req.accountId(), req.amount().doubleValue());
    return PaymentResponse.from(r);
  }
}`,
    how: 'Adapter implements our interface and translates calls/types to the foreign API.',
    when: 'Third-party or legacy shape ≠ your domain interface.',
    whenNot: 'You own both sides — just change the API; or you need to hide many services (Facade).',
    recognize: 'Two plugs do not fit → Adapter',
    memory: 'Adapter = "Two plugs don\'t fit. Adapter makes them fit."',
  },
  {
    id: 'decorator',
    name: 'Decorator',
    family: 'Structural',
    rememberProblem: 'Add logging/metrics/retry without changing the class.',
    story: 'Start with BasicPayment; wrap logging, metrics, audit dynamically.',
    badCode: `// Copy-paste logging into every Payment implementation`,
    pain: `Modify every class
      ↓
Cross-cutting mess`,
    diagram: `Basic Payment
      ↓ Logging wrap
      ↓ Metrics wrap
      ↓ Audit wrap`,
    goodCode: `Payment payment = new AuditPaymentDecorator(
    new LoggingPaymentDecorator(
        new BasicPayment()));`,
    how: 'Same interface; each wrapper delegates and adds behavior.',
    when: 'Stackable cross-cutting behavior around one core object.',
    whenNot: 'Access control / caching gate (Proxy); simplifying many services (Facade).',
    recognize: 'Wrap → enhance → wrap again',
    memory: 'Decorator = "Wrap the object to add behavior."',
  },
  {
    id: 'facade',
    name: 'Facade',
    family: 'Structural',
    rememberProblem: "Client shouldn't know 10 services.",
    story: 'Pay needs fraud, balance, gateway, ledger, notify, audit.',
    badCode: `fraudService.check();
balanceService.check();
gateway.pay();
ledger.record();
notification.send();
audit.record();`,
    pain: 'Client couples to the whole subsystem; order mistakes everywhere.',
    diagram: `Client
  │
  ▼
PaymentFacade
  ├── Fraud · Balance · Gateway
  ├── Ledger · Notification · Audit`,
    goodCode: `paymentFacade.pay(request);`,
    how: 'One entry point orchestrates internals; client sees a simple API.',
    when: 'Stable workflow over many collaborators.',
    whenNot: 'Objects need rich peer-to-peer coordination (Mediator).',
    recognize: 'One door to a complex house',
    memory: 'Facade = "Hide complexity behind one simple door."',
  },
  {
    id: 'proxy',
    name: 'Proxy',
    family: 'Structural',
    rememberProblem: 'I need authorization / caching / lazy loading in front.',
    story: 'PaymentService must check JWT and cache before hitting the real service.',
    badCode: `// Controllers call real service; security sprinkled ad hoc`,
    pain: 'Access rules duplicated; easy to bypass.',
    diagram: `Client → Proxy (Security/Cache/Log) → Real Service`,
    goodCode: `class PaymentProxy implements PaymentService {
  public Receipt pay(PaymentRequest req) {
    auth.ensure(req);
    return cache.get(req.id(), () -> real.pay(req));
  }
}`,
    how: 'Same interface; proxy decides whether/when to call the real object.',
    when: 'Control access, lazy init, remote stub, cache.',
    whenNot: 'Only adding behavior without access policy (Decorator).',
    recognize: 'Someone stands in front of the real object',
    memory: 'Proxy = "Someone stands in front of the real object."',
  },
  {
    id: 'observer',
    name: 'Observer',
    family: 'Behavioral',
    rememberProblem: 'When payment succeeds, notify everyone.',
    story: 'Payment success → email, SMS, Kafka, analytics, loyalty.',
    badCode: `pay();
email.send(); sms.send(); kafka.publish(); analytics.track();`,
    pain: 'Publisher hardcodes listeners; adding loyalty means editing pay().',
    diagram: `PaymentPublisher
       ├── EmailObserver
       ├── SmsObserver
       ├── AnalyticsObserver
       └── LoyaltyObserver`,
    goodCode: `publisher.subscribe(new EmailObserver());
publisher.subscribe(new KafkaObserver());
publisher.notify(PaymentSucceeded.of(p));`,
    how: 'Subject notifies registered observers; open for new listeners.',
    when: 'One event, many independent reactions.',
    whenNot: 'Need guaranteed distributed delivery semantics — use a broker (conceptually similar, not GoF Observer).',
    recognize: 'One event → many listeners',
    memory: 'Observer = "One event, many listeners."',
  },
  {
    id: 'chain-of-responsibility',
    name: 'Chain of Responsibility',
    family: 'Behavioral',
    rememberProblem: 'Try validation rules one by one.',
    story: 'Auth → fraud → balance → limit → pay.',
    badCode: `if (!auth) return; if (!fraud) return; if (!balance) return; ...`,
    pain: 'Giant method; hard to reorder/skip steps.',
    diagram: `Request → Auth → Fraud → Balance → Limit → Payment`,
    goodCode: `Handler chain = auth.link(fraud).link(balance).link(limit);
chain.handle(request);`,
    how: 'Each handler processes or passes to next.',
    when: 'Ordered pipeline of optional handlers.',
    whenNot: 'Fixed skeleton with mandatory steps (Template Method).',
    recognize: 'Pass the request down the line',
    memory: 'Chain = "Pass the request down the line until someone handles it."',
  },
  {
    id: 'command',
    name: 'Command',
    family: 'Behavioral',
    rememberProblem: 'I need queue / retry / undo a request.',
    story: 'PAY / REFUND / CANCEL as objects for async execution.',
    badCode: `// Controllers call paymentService methods directly; no queue object`,
    pain: 'Cannot audit/retry/undo uniformly.',
    diagram: `API → Command → Queue → Handler → PaymentService`,
    goodCode: `record PayCommand(PaymentRequest req) implements Command {
  public void execute(PaymentService svc) { svc.pay(req); }
}
queue.submit(new PayCommand(req));`,
    how: 'Action becomes an object with execute (and optionally undo).',
    when: 'Queue, retry, schedule, audit, undo.',
    whenNot: 'Simple sync call with no lifecycle.',
    recognize: 'Turn an action into an object',
    memory: 'Command = "Turn an action into an object."',
  },
  {
    id: 'state',
    name: 'State',
    family: 'Behavioral',
    rememberProblem: 'Payment behaves differently in CREATED / PAID / FAILED.',
    story: 'Lifecycle: CREATED → PROCESSING → SUCCESS → REFUNDED.',
    badCode: `if (status == CREATED) ...
if (status == PROCESSING) ...
if (status == SUCCESS) ...`,
    pain: 'Status if/else explodes; illegal transitions easy.',
    diagram: `Payment → CurrentState
            ├── CreatedState
            ├── ProcessingState
            └── SuccessState`,
    goodCode: `payment.transition(new ProcessingState());
payment.pay(); // delegated to current state`,
    how: 'State object owns allowed behavior; context swaps state.',
    when: 'Behavior depends on lifecycle; illegal transitions matter.',
    whenNot: 'Caller picks algorithm independently of lifecycle (Strategy).',
    recognize: 'Same object, different behavior by state',
    memory: 'State = "Same object, different behavior depending on its state."',
  },
  {
    id: 'template-method',
    name: 'Template Method',
    family: 'Behavioral',
    rememberProblem: 'Recipe fixed; some steps differ (Card vs UPI).',
    story: 'Validate → Authenticate → Process → Audit for every rail.',
    badCode: `// Duplicate full workflow in CardPayment and UpiPayment`,
    pain: 'Copy-paste workflow; one rail misses audit.',
    diagram: `PaymentTemplate
      ├── CardPayment (hooks)
      └── UpiPayment (hooks)`,
    goodCode: `abstract class PaymentTemplate {
  final Receipt run(PaymentRequest r) {
    validate(r); authenticate(r);
    var result = process(r); // hook
    audit(r, result); return result;
  }
  abstract Receipt process(PaymentRequest r);
}`,
    how: 'Base class owns order; subclasses fill steps.',
    when: 'Invariant algorithm structure, variable steps.',
    whenNot: 'Fully pluggable pipeline (Chain) or runtime algorithm swap (Strategy).',
    recognize: 'Fixed recipe, customizable steps',
    memory: 'Template Method = "Recipe is fixed; some steps can change."',
  },
  {
    id: 'singleton',
    name: 'Singleton',
    family: 'Creational',
    rememberProblem: 'One shared application-wide config/cache/resource.',
    story: 'Holiday calendar / payment config must not drift across callers.',
    badCode: `new ConfigManager(); // everywhere → divergent caches`,
    pain: 'Two configs, two truths.',
    diagram: `Application → One shared instance`,
    goodCode: `@Component
class PaymentConfig { /* Spring default scope = singleton */ }`,
    how: 'One instance per container/JVM; prefer DI over hand-rolled static.',
    when: 'Truly process-global immutable/shared resource.',
    whenNot: 'Per-request state; multi-tenant isolation; cluster-wide uniqueness (use DB/Redis).',
    recognize: 'Need exactly one shared thing in the process',
    memory: 'Singleton = "One shared instance" — Spring bean often replaces hand-rolled Singleton.',
  },
  {
    id: 'abstract-factory',
    name: 'Abstract Factory',
    family: 'Creational',
    rememberProblem: 'Create a family of related products (India vs Europe pack).',
    story: 'India: UPI + INR tax. Europe: SEPA + VAT + FX.',
    badCode: `// Mix UPI gateway with VAT calculator by accident`,
    pain: 'Mismatched family members.',
    diagram: `PaymentFactory
   ├── IndiaFactory → UPI + TaxIN + INR
   └── EuropeFactory → SEPA + VAT + FX`,
    goodCode: `interface RegionKit {
  PaymentGateway gateway();
  TaxCalculator tax();
}
class IndiaKit implements RegionKit { ... }`,
    how: 'Factory of related products that must stay consistent.',
    when: 'Families of objects vary together by region/vendor.',
    whenNot: 'Only one product type (Factory Method).',
    recognize: 'Family of related products',
    memory: 'Factory = one product. Abstract Factory = family of related products.',
  },
  {
    id: 'flyweight',
    name: 'Flyweight',
    family: 'Structural',
    rememberProblem: "Don't recreate the same expensive shared object.",
    story: '100M transactions share Currency / Country / MCC.',
    badCode: `new Currency("INR"); // per row → memory blowup`,
    pain: 'Duplicate immutable data × millions.',
    diagram: `Transaction → unique fields
            → shared Currency (flyweight pool)`,
    goodCode: `Currency inr = CurrencyPool.intern("INR");
txn = new Txn(id, amount, inr);`,
    how: 'Share intrinsic immutable state; keep extrinsic data on the row.',
    when: 'Huge N with repeated immutable attributes.',
    whenNot: 'Mutable shared state (race hell).',
    recognize: 'Share expensive common state',
    memory: 'Flyweight = "Don\'t create the same expensive object again and again. Share it."',
  },
  {
    id: 'composite',
    name: 'Composite',
    family: 'Structural',
    rememberProblem: 'Treat one object and a group the same way.',
    story: 'Bank → Region → Branch; all support calculateTotal().',
    badCode: `// Separate code paths for Branch vs Region totals`,
    pain: 'Client cares about tree shape.',
    diagram: `Bank
 ├── Region
 │    ├── Branch
 │    └── Branch
 └── Region`,
    goodCode: `interface Unit { BigDecimal total(); }
class Branch implements Unit { ... }
class Region implements Unit {
  List<Unit> children; /* sum children */
}`,
    how: 'Uniform interface for leaf and composite nodes.',
    when: 'Part-whole hierarchies with same operations.',
    whenNot: 'Flat list with no nesting.',
    recognize: 'Tree where one and many look the same',
    memory: 'Composite = "Treat one object and a group of objects the same way."',
  },
  {
    id: 'bridge',
    name: 'Bridge',
    family: 'Structural',
    rememberProblem: 'Two dimensions change independently (type × provider).',
    story: 'Card/UPI/Bank × Stripe/Adyen/PayPal without CardStripe, CardPayPal…',
    badCode: `class CardStripe {} class CardPayPal {} class UpiStripe {} // explosion`,
    pain: 'Combinatorial class explosion.',
    diagram: `PaymentType ──uses──▶ Provider
 Card/UPI/Bank         Stripe/Adyen/PayPal`,
    goodCode: `class CardPayment {
  private final Provider provider;
  void pay() { provider.charge(...); }
}`,
    how: 'Abstraction holds implementor reference; axes evolve separately.',
    when: 'Two orthogonal variation axes.',
    whenNot: 'Only one axis varies (Strategy/Factory enough).',
    recognize: 'Two dimensions → separate them',
    memory: 'Bridge = "Two dimensions change independently. Separate them."',
  },
  {
    id: 'prototype',
    name: 'Prototype',
    family: 'Creational',
    rememberProblem: 'Copy an existing object instead of building from scratch.',
    story: 'Standing instruction / fee template is expensive to assemble.',
    badCode: `// Rebuild 20-field template every month`,
    pain: 'Slow, error-prone reconstruction.',
    diagram: `Expensive template → clone → clone → clone`,
    goodCode: `PaymentTemplate next = existing.copyWith(nextMonthDate);
// prefer copy constructor / factory over Object.clone()`,
    how: 'Clone/copy a configured prototype; tweak deltas.',
    when: 'Costly setup; many similar instances.',
    whenNot: 'Trivial objects; prefer immutable withers.',
    recognize: 'Clone template',
    memory: 'Prototype = "Copy an existing object instead of building from scratch."',
  },
  {
    id: 'memento',
    name: 'Memento',
    family: 'Behavioral',
    rememberProblem: 'Save a snapshot so I can go back.',
    story: 'Ops edits fee table; needs undo.',
    badCode: `// Mutate live config with no snapshot`,
    pain: 'Cannot rollback safely.',
    diagram: `PaymentConfig → save → Memento → restore`,
    goodCode: `Memento snap = config.save();
config.apply(badChange);
config.restore(snap);`,
    how: 'Opaque snapshot of state for later restore.',
    when: 'Undo/rollback of mutable configuration or editor state.',
    whenNot: 'Full event sourcing already provides history.',
    recognize: 'Save and restore state',
    memory: 'Memento = "Save a snapshot so I can go back."',
  },
  {
    id: 'iterator',
    name: 'Iterator',
    family: 'Behavioral',
    rememberProblem: 'Walk a collection without knowing storage.',
    story: 'TransactionCollection may be list, tree, or paged DB.',
    badCode: `for (int i = 0; i < arr.length; i++) // leaks array`,
    pain: 'Client coupled to structure.',
    diagram: `Iterator → hasNext() / next()`,
    goodCode: `for (Txn t : transactions) { ... } // Iterable`,
    how: 'Iterator abstracts traversal.',
    when: 'Hide representation; support multiple traversal styles.',
    whenNot: 'Simple List where exposing List is fine.',
    recognize: 'Traverse without exposing internals',
    memory: 'Iterator = "Walk through a collection without knowing how it is stored."',
  },
  {
    id: 'mediator',
    name: 'Mediator',
    family: 'Behavioral',
    rememberProblem: 'Objects stop talking directly; one hub coordinates.',
    story: 'Fraud ↔ Ledger ↔ Notify ↔ Limit become a mesh.',
    badCode: `A→B A→C B→C B→D C→D // spaghetti`,
    pain: 'N² couplings.',
    diagram: `     Mediator
    /    |    \\
   A     B     C`,
    goodCode: `mediator.onPaymentAuthorized(event);
// colleagues talk only to mediator`,
    how: 'Central coordinator owns interaction rules.',
    when: 'Complex multi-colleague workflows.',
    whenNot: 'Simple client→subsystem API (Facade).',
    recognize: 'Centralize communication',
    memory: 'Mediator = "Objects stop talking directly; one central object coordinates them."',
  },
  {
    id: 'visitor',
    name: 'Visitor',
    family: 'Behavioral',
    rememberProblem: 'Add operations to a stable object structure.',
    story: 'Payment/Refund/Settlement/Chargeback need tax, audit, export.',
    badCode: `// Add export() to every payment type class forever`,
    pain: 'Object structure churns for every new report.',
    diagram: `Elements (stable) ← Visitor (tax/audit/export)`,
    goodCode: `payment.accept(new TaxVisitor());
payment.accept(new AuditVisitor());`,
    how: 'Double dispatch: element accepts visitor; visitor has per-type methods.',
    when: 'Structure stable; operations change often.',
    whenNot: 'Structure changes more than operations — Visitor becomes painful.',
    recognize: 'New operations over stable structure',
    memory: 'Visitor = "Add new operations to a stable object structure."',
  },
  {
    id: 'interpreter',
    name: 'Interpreter',
    family: 'Behavioral',
    rememberProblem: 'Evaluate a tiny rule language.',
    story: '“new payee AND amount > 50000 → extra OTP”.',
    badCode: `// Hardcode every rule combination in if/else`,
    pain: 'Rules explode; business cannot change without deploy.',
    diagram: `Rule AST → interpret(context) → boolean`,
    goodCode: `Expression rule = and(newPayee(), gt(amount(), 50_000));
if (rule.interpret(ctx)) requireOtp();`,
    how: 'Grammar as objects; interpret against context.',
    when: 'Small DSL / rule expressions.',
    whenNot: 'Full programming language — use a real engine.',
    recognize: 'Tiny rule language',
    memory: 'Interpreter = "Evaluate a tiny domain rule language."',
  },
];

export const ONE_LINERS: [string, string][] = [
  ['Singleton', 'One shared instance'],
  ['Factory', 'Decide which object to create'],
  ['Abstract Factory', 'Create a family of related objects'],
  ['Builder', 'Build complex object step-by-step'],
  ['Prototype', 'Copy existing object'],
  ['Adapter', 'Make incompatible interfaces work together'],
  ['Decorator', 'Wrap object to add behavior'],
  ['Facade', 'One simple door to a complex system'],
  ['Proxy', 'Stand in front of an object'],
  ['Composite', 'Treat one and many uniformly'],
  ['Bridge', 'Separate two independent dimensions'],
  ['Flyweight', 'Share expensive common state'],
  ['Strategy', 'Same job, different algorithm'],
  ['Observer', 'One event, many listeners'],
  ['Chain', 'Pass request through handlers'],
  ['Command', 'Turn an action into an object'],
  ['State', 'Behavior depends on state'],
  ['Template Method', 'Fixed recipe, customizable steps'],
  ['Mediator', 'Centralize communication'],
  ['Memento', 'Save and restore state'],
  ['Iterator', 'Traverse without exposing internals'],
  ['Visitor', 'Add operations without changing object structure'],
  ['Interpreter', 'Evaluate a tiny rule language'],
];
