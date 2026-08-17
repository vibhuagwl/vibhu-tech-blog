/** Interactive drills + revision tools for GoF playbook. */

export type Flashcard = {id: string; front: string; back: string};
export type GuessQ = {
  id: string;
  scenario: string;
  options: [string, string, string, string];
  answer: string;
  why: string;
};

export const FLASHCARDS: Flashcard[] = [
  {id: 'f1', front: "Old API doesn't match your interface. Which pattern?", back: 'Adapter'},
  {id: 'f2', front: 'Same operation, multiple algorithms?', back: 'Strategy'},
  {id: 'f3', front: 'One event, many listeners?', back: 'Observer'},
  {id: 'f4', front: 'Too many constructor arguments?', back: 'Builder'},
  {id: 'f5', front: 'Add behavior by wrapping?', back: 'Decorator'},
  {id: 'f6', front: 'Which concrete payment class to create?', back: 'Factory'},
  {id: 'f7', front: 'Hide fraud+ledger+notify behind one call?', back: 'Facade'},
  {id: 'f8', front: 'JWT/cache before real PaymentService?', back: 'Proxy'},
  {id: 'f9', front: 'Auth → fraud → balance pipeline?', back: 'Chain of Responsibility'},
  {id: 'f10', front: 'Queue/retry/undo a payment action?', back: 'Command'},
  {id: 'f11', front: 'CREATED/PAID/FAILED change behavior?', back: 'State'},
  {id: 'f12', front: 'Same workflow, different steps for Card/UPI?', back: 'Template Method'},
  {id: 'f13', front: 'India pack vs Europe pack of related objects?', back: 'Abstract Factory'},
  {id: 'f14', front: 'One holiday calendar for the JVM?', back: 'Singleton'},
  {id: 'f15', front: 'Share INR Currency across 100M rows?', back: 'Flyweight'},
  {id: 'f16', front: 'Bank/Region/Branch same total() API?', back: 'Composite'},
  {id: 'f17', front: 'Payment type × provider without class explosion?', back: 'Bridge'},
  {id: 'f18', front: 'Clone standing instruction template?', back: 'Prototype'},
  {id: 'f19', front: 'Undo fee-config change?', back: 'Memento'},
  {id: 'f20', front: 'Walk transactions without exposing List?', back: 'Iterator'},
  {id: 'f21', front: 'Stop mesh of service-to-service calls?', back: 'Mediator'},
  {id: 'f22', front: 'Add tax/export without editing Payment types?', back: 'Visitor'},
  {id: 'f23', front: 'Evaluate “amount>50k AND newPayee”?', back: 'Interpreter'},
  {id: 'f24', front: 'Factory vs Strategy — which picks the object?', back: 'Factory'},
  {id: 'f25', front: 'Factory vs Strategy — which picks the algorithm?', back: 'Strategy'},
  {id: 'f26', front: 'Decorator vs Proxy — add behavior?', back: 'Decorator'},
  {id: 'f27', front: 'Decorator vs Proxy — control access?', back: 'Proxy'},
  {id: 'f28', front: 'Facade vs Mediator — simplify client access?', back: 'Facade'},
  {id: 'f29', front: 'Strategy vs State — lifecycle drives behavior?', back: 'State'},
  {id: 'f30', front: 'Factory vs Abstract Factory — family of products?', back: 'Abstract Factory'},
  {id: 'f31', front: 'Spring @Bean default scope is conceptually…', back: 'Singleton'},
  {id: 'f32', front: '@Transactional / AOP often use…', back: 'Proxy (conceptually)'},
];

export const GUESS: GuessQ[] = [
  {
    id: 'g1',
    scenario:
      'Card, UPI, Bank implementations exist. Caller must not know which concrete class to instantiate.',
    options: ['Strategy', 'Factory', 'Adapter', 'Observer'],
    answer: 'Factory',
    why: 'Creation of a concrete product behind an interface — classic Factory.',
  },
  {
    id: 'g2',
    scenario: 'Fee calculation differs by corridor; PaymentService should stay stable.',
    options: ['Factory', 'State', 'Strategy', 'Builder'],
    answer: 'Strategy',
    why: 'Same job (fee), different algorithms swapped at runtime.',
  },
  {
    id: 'g3',
    scenario: 'PaymentRequest has 12 optional fields and telescoping constructors.',
    options: ['Builder', 'Prototype', 'Singleton', 'Facade'],
    answer: 'Builder',
    why: 'Step-by-step construction of a complex object.',
  },
  {
    id: 'g4',
    scenario: 'Legacy bank SDK method signatures do not match PaymentGateway.',
    options: ['Facade', 'Adapter', 'Proxy', 'Bridge'],
    answer: 'Adapter',
    why: 'Translate incompatible interfaces.',
  },
  {
    id: 'g5',
    scenario: 'Add audit + metrics around BasicPayment without editing it.',
    options: ['Proxy', 'Decorator', 'Facade', 'Visitor'],
    answer: 'Decorator',
    why: 'Wrap to add behavior.',
  },
  {
    id: 'g6',
    scenario: 'Mobile app should call one pay() that runs fraud, ledger, notify…',
    options: ['Mediator', 'Facade', 'Adapter', 'Composite'],
    answer: 'Facade',
    why: 'One door to a subsystem.',
  },
  {
    id: 'g7',
    scenario: 'Must enforce JWT and rate limit before real PaymentService.',
    options: ['Decorator', 'Proxy', 'Facade', 'Command'],
    answer: 'Proxy',
    why: 'Stand in front and control access.',
  },
  {
    id: 'g8',
    scenario: 'On SUCCESS, email, SMS, Kafka, loyalty all react independently.',
    options: ['Mediator', 'Observer', 'Chain', 'Command'],
    answer: 'Observer',
    why: 'One event, many listeners.',
  },
  {
    id: 'g9',
    scenario: 'Validation pipeline: KYC → AML → fraud → limit, each may stop.',
    options: ['Template Method', 'Chain of Responsibility', 'Strategy', 'State'],
    answer: 'Chain of Responsibility',
    why: 'Pass request through handlers.',
  },
  {
    id: 'g10',
    scenario: 'Need to enqueue refunds with retry and audit trail.',
    options: ['Command', 'State', 'Observer', 'Iterator'],
    answer: 'Command',
    why: 'Action as an object for queue/retry.',
  },
  {
    id: 'g11',
    scenario: 'Cannot refund a payment still in CREATED; behavior depends on status.',
    options: ['Strategy', 'State', 'Template Method', 'Factory'],
    answer: 'State',
    why: 'Lifecycle drives allowed behavior.',
  },
  {
    id: 'g12',
    scenario: 'Every rail validates→books→notifies; only process() differs.',
    options: ['Strategy', 'Template Method', 'Chain', 'Bridge'],
    answer: 'Template Method',
    why: 'Fixed recipe, customizable steps.',
  },
  {
    id: 'g13',
    scenario: 'India vs US must supply matching gateway + tax + currency together.',
    options: ['Factory', 'Abstract Factory', 'Builder', 'Bridge'],
    answer: 'Abstract Factory',
    why: 'Family of related products.',
  },
  {
    id: 'g14',
    scenario: 'Card/UPI × Stripe/Adyen would create CardStripe, UpiAdyen… classes.',
    options: ['Bridge', 'Adapter', 'Composite', 'Flyweight'],
    answer: 'Bridge',
    why: 'Separate two independent dimensions.',
  },
  {
    id: 'g15',
    scenario: 'Millions of txns each `new Currency("INR")` blow memory.',
    options: ['Singleton', 'Flyweight', 'Prototype', 'Proxy'],
    answer: 'Flyweight',
    why: 'Share immutable common state.',
  },
  {
    id: 'g16',
    scenario: 'Region and Branch both expose calculateTotal() in a tree.',
    options: ['Composite', 'Iterator', 'Visitor', 'Facade'],
    answer: 'Composite',
    why: 'One and many treated uniformly.',
  },
  {
    id: 'g17',
    scenario: 'Ops needs undo after a bad fee-table edit.',
    options: ['Command', 'Memento', 'State', 'Prototype'],
    answer: 'Memento',
    why: 'Snapshot and restore.',
  },
  {
    id: 'g18',
    scenario: 'Fraud, ledger, notify must not call each other in a mesh.',
    options: ['Facade', 'Mediator', 'Observer', 'Proxy'],
    answer: 'Mediator',
    why: 'Centralize colleague communication.',
  },
  {
    id: 'g19',
    scenario: 'Add GST export and audit reports without modifying Payment/Refund classes.',
    options: ['Visitor', 'Decorator', 'Strategy', 'Interpreter'],
    answer: 'Visitor',
    why: 'New operations on a stable structure.',
  },
  {
    id: 'g20',
    scenario: 'Business rule string “newPayee AND amount>50000” must be evaluated.',
    options: ['Interpreter', 'Strategy', 'Chain', 'Visitor'],
    answer: 'Interpreter',
    why: 'Tiny rule language.',
  },
];

export const CODE_SMELL: [string, string][] = [
  ['Huge if/else for object creation', 'Factory'],
  ['Huge if/else for algorithms', 'Strategy'],
  ['10 constructor parameters', 'Builder'],
  ["Old API doesn't match", 'Adapter'],
  ['Need add behavior without modifying class', 'Decorator'],
  ['Client calls 7 services', 'Facade'],
  ['Need authorization/caching before real service', 'Proxy'],
  ['One event → many listeners', 'Observer'],
  ['Many validation steps', 'Chain of Responsibility'],
  ['Request needs queue/retry/undo', 'Command'],
  ['Huge status-based if/else', 'State'],
  ['Same algorithm, different steps', 'Template Method'],
  ['Mismatched regional kits', 'Abstract Factory'],
  ['Class explosion on two axes', 'Bridge'],
  ['Duplicate immutable fields × millions', 'Flyweight'],
  ['Tree of units with same op', 'Composite'],
  ['Rebuild expensive template', 'Prototype'],
  ['No undo for config edit', 'Memento'],
  ['Service mesh spaghetti', 'Mediator'],
  ['New report forces editing every type', 'Visitor'],
];

export const REVISION_15: [string, string][] = [
  ['Need object creation', 'Factory'],
  ['Too many constructor parameters', 'Builder'],
  ['Different algorithms', 'Strategy'],
  ['Interface mismatch', 'Adapter'],
  ['Add behavior', 'Decorator'],
  ['Simplify complexity', 'Facade'],
  ['Control access', 'Proxy'],
  ['One-to-many notification', 'Observer'],
  ['Request pipeline', 'Chain'],
  ['Undo/queue/retry', 'Command'],
  ['State-dependent behavior', 'State'],
  ['Fixed recipe, variable steps', 'Template Method'],
  ['Related product family', 'Abstract Factory'],
  ['Two dimensions', 'Bridge'],
  ['Share common objects', 'Flyweight'],
  ['Tree one/many', 'Composite'],
  ['Clone template', 'Prototype'],
  ['Undo snapshot', 'Memento'],
  ['Central communication', 'Mediator'],
  ['Traverse collection', 'Iterator'],
  ['New ops on stable structure', 'Visitor'],
  ['One shared instance', 'Singleton'],
  ['Tiny rule language', 'Interpreter'],
];

export const WHEN_YOU_SEE: [string, string][] = [
  ['"Which object?"', 'Factory'],
  ['"Too many parameters?"', 'Builder'],
  ['"Different algorithm?"', 'Strategy'],
  ['"Interface mismatch?"', 'Adapter'],
  ['"Add behavior?"', 'Decorator'],
  ['"Hide complexity?"', 'Facade'],
  ['"Control access?"', 'Proxy'],
  ['"One event → many?"', 'Observer'],
  ['"Pipeline?"', 'Chain'],
  ['"Action as object?"', 'Command'],
  ['"Behavior changes by status?"', 'State'],
  ['"Same recipe, different steps?"', 'Template Method'],
  ['"Two dimensions?"', 'Bridge'],
  ['"Tree?"', 'Composite'],
  ['"Share common objects?"', 'Flyweight'],
  ['"Undo?"', 'Memento'],
  ['"Central communication?"', 'Mediator'],
  ['"Traverse collection?"', 'Iterator'],
  ['"New operations over stable structure?"', 'Visitor'],
  ['"Family of products?"', 'Abstract Factory'],
  ['"One shared resource?"', 'Singleton'],
  ['"Clone template?"', 'Prototype'],
  ['"Tiny DSL/rule?"', 'Interpreter'],
];

export const COMPARISONS: {title: string; ascii: string}[] = [
  {
    title: 'Factory vs Strategy',
    ascii: `Factory → Which object should I create?
          PaymentFactory → CardPayment

Strategy → Which algorithm should I use?
          FeeStrategy → CardFeeStrategy`,
  },
  {
    title: 'Adapter vs Decorator vs Proxy',
    ascii: `Adapter   → Interface mismatch → make compatible
Decorator → Need extra behavior → wrap and enhance
Proxy     → Need access control → stand in front`,
  },
  {
    title: 'Facade vs Mediator',
    ascii: `Facade   → Simplify CLIENT access to a subsystem
Mediator → Coordinate COMMUNICATION between objects`,
  },
  {
    title: 'Strategy vs State',
    ascii: `Strategy → I choose the algorithm
State    → The object's state changes its behavior`,
  },
  {
    title: 'Factory vs Abstract Factory',
    ascii: `Factory         → One product
Abstract Factory → Related family of products`,
  },
  {
    title: 'Decorator vs Proxy vs Facade vs Adapter',
    ascii: `Decorator → Add behavior
Proxy     → Control access
Facade    → Simplify access
Adapter   → Change interface`,
  },
];

export const DECISION_TREE = `START
  │
  ▼
Creating objects?
  YES → Complex construction? → Builder
      → Choose implementation? → Factory
      → Related product family? → Abstract Factory
      → Clone template? → Prototype
      → One process global? → Singleton (prefer Spring bean)
  │
  NO → Connecting objects?
  YES → Interfaces don't match? → Adapter
      → Add behavior dynamically? → Decorator
      → Simplify subsystem? → Facade
      → Control access? → Proxy
      → Tree/group structure? → Composite
      → Two axes? → Bridge
      → Share immutable? → Flyweight
  │
  NO → Behavior / communication?
      → Different algorithms? → Strategy
      → Behavior by state? → State
      → Notify many? → Observer
      → Handler pipeline? → Chain
      → Action as object? → Command
      → Fixed workflow, variable steps? → Template Method
      → Central hub? → Mediator
      → Snapshot/undo? → Memento
      → Traverse hidden structure? → Iterator
      → New ops on stable types? → Visitor
      → Tiny rule language? → Interpreter`;

export const SPRING_LINKS: [string, string][] = [
  ['Spring Bean (default scope)', 'Singleton — conceptually; container manages lifecycle'],
  ['BeanFactory / ObjectProvider', 'Factory — conceptually'],
  ['Injected collaborators / @Qualifier', 'Strategy / DI — choose algorithm/impl'],
  ['JDK/CGLIB proxies, @Transactional, AOP', 'Proxy — conceptually'],
  ['JdbcTemplate / RestTemplate style', 'Template Method — template-style abstraction'],
  ['ApplicationEvent / @EventListener', 'Observer-like mechanism'],
  ['@Service facade over repositories', 'Facade-like architectural role'],
  ['Repository / client adapters', 'Adapter-like roles for foreign APIs'],
];

export const SPRING_NOTE =
  'Say "conceptually similar" unless you implemented the textbook GoF structure. Spring is not a GoF museum — it uses these ideas.';

export const FINAL_PROJECT = `                         API
                          │
                          ▼
                    PaymentFacade
                          │
                ┌─────────┴─────────┐
                │                   │
              Builder             Proxy
                │                   │
                ▼                   ▼
           PaymentRequest      Security/Cache
                                    │
                                    ▼
                               PaymentService
                                    │
               ┌────────────────────┼──────────────────┐
               │                    │                  │
            Factory              Strategy            Chain
               │                    │                  │
               ▼                    ▼                  ▼
           Gateway             Routing/Fee        Validation
               │
        ┌──────┼───────┐
        ▼      ▼       ▼
       UPI    Card    Bank
        │
        ▼
     Adapter → Legacy Bank API

Payment Success → Observer → Email / Kafka / Audit
Payment lifecycle → State
Async refund → Command
Card vs UPI steps → Template Method`;

export const FINAL_PROJECT_USES: [string, string][] = [
  ['Factory', 'Create payment gateway'],
  ['Strategy', 'Fee / routing'],
  ['Builder', 'PaymentRequest'],
  ['Adapter', 'Legacy bank API'],
  ['Decorator', 'Logging + metrics + audit'],
  ['Facade', 'PaymentFacade'],
  ['Proxy', 'Authorization / cache'],
  ['Observer', 'Payment events'],
  ['Chain', 'Validation pipeline'],
  ['Command', 'Async payment / refund'],
  ['State', 'Payment lifecycle'],
  ['Template Method', 'Processing workflow'],
];
