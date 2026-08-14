export type PatternCategory = 'Creational' | 'Structural' | 'Behavioral';

export type PatternStory = {
  name: string;
  slug: string;
  category: PatternCategory;
  /** 3–6 words. This is what you memorize. */
  purpose: string;
  /** One sentence a junior can repeat. */
  inPlainWords: string;
  /** Financial scene — this is the memory. */
  story: string;
  /** What Priya / the bank would say. */
  sayThis: string;
  /** The usual mix-up. */
  dontConfuseWith: string;
  whenNot: string;
};

export const BANK = 'Meridian Bank';

export const MASTER_STORY = `Priya opens the Meridian Bank app and pays her landlord ₹45,000. She taps one Pay button. She does not call fraud, ledger, UPI, SMS, and RBI reporting herself — that is a **Facade**.

The request first hits a **Proxy**: her JWT and a rate limit. Only then does core banking wake up.

The payload has a dozen optional fields (remarks, split, GSTIN), so we **Builder** it. A **Factory Method** picks the rail: UPI today, NEFT tomorrow. Because she is in India, an **Abstract Factory** hands us the India pack (INR + UPI + RBI MIS), not the US pack (USD + ACH + Fedwire). How UPI actually talks to NPCI is a **Strategy**. The UPI SDK looks nothing like our \`PaymentGateway\` interface, so an **Adapter** translates.

Before money moves, a **Chain** runs: KYC → AML → fraud → daily limit. A tiny rule language (**Interpreter**) says “new payee AND amount > ₹50,000 → extra OTP”. The core debit is wrapped with fraud scoring, audit, and metrics — **Decorator**, not copy-paste inside the ledger.

The debit itself is a **Command**: queued, retried, audited. Its **State** is CREATED → AUTHORIZED → POSTED. You cannot refund CREATED. Every rail still does validate → book → notify; NEFT and RTGS only fill the steps (**Template Method**). A **Mediator** (settlement hub) stops fraud from calling ledger from calling notify. When the payment posts, **Observer** fans out: SMS, email, ledger projection, RBI file.

If this had been a salary file, **Composite** would treat 4,000 credits as one bulk. **Iterator** would walk the file without loading 4,000 rows into RAM. **Flyweight** would share one INR object, not 4,000 currency copies. SMS vs email, Twilio vs SES, are two axes — **Bridge**. Next month’s rent is a **Prototype** of this standing instruction. Ops rolled back a bad fee table with **Memento**. Month-end GST, audit, and statements walk the same accounts with new visitors — **Visitor**. And there is one holiday calendar, one UTR sequence — **Singleton**.

That is all 23. One payment. Remember the payment, and the patterns come back.`;

export const PURPOSE_WALL: {name: string; purpose: string; slug: string}[] = [
  {name: 'Singleton', purpose: 'One shared thing', slug: 'singleton'},
  {name: 'Factory Method', purpose: 'Pick which class', slug: 'factory-method'},
  {name: 'Abstract Factory', purpose: 'Pick a matching family', slug: 'abstract-factory'},
  {name: 'Builder', purpose: 'Assemble many optional fields', slug: 'builder'},
  {name: 'Prototype', purpose: 'Clone a template', slug: 'prototype'},
  {name: 'Adapter', purpose: 'Translate a foreign API', slug: 'adapter'},
  {name: 'Bridge', purpose: 'Two axes change independently', slug: 'bridge'},
  {name: 'Composite', purpose: 'One and many look the same', slug: 'composite'},
  {name: 'Decorator', purpose: 'Wrap extra behavior', slug: 'decorator'},
  {name: 'Facade', purpose: 'One door for many systems', slug: 'facade'},
  {name: 'Flyweight', purpose: 'Share tiny immutable data', slug: 'flyweight'},
  {name: 'Proxy', purpose: 'Guard the real object', slug: 'proxy'},
  {name: 'Chain of Responsibility', purpose: 'Pass through a pipeline', slug: 'chain-of-responsibility'},
  {name: 'Command', purpose: 'Turn an action into an object', slug: 'command'},
  {name: 'Interpreter', purpose: 'Evaluate a tiny rule language', slug: 'interpreter'},
  {name: 'Iterator', purpose: 'Walk without exposing storage', slug: 'iterator'},
  {name: 'Mediator', purpose: 'Talk through a hub', slug: 'mediator'},
  {name: 'Memento', purpose: 'Snapshot and restore', slug: 'memento'},
  {name: 'Observer', purpose: 'One event, many listeners', slug: 'observer'},
  {name: 'State', purpose: 'Behavior follows lifecycle', slug: 'state'},
  {name: 'Strategy', purpose: 'Swap the algorithm', slug: 'strategy'},
  {name: 'Template Method', purpose: 'Same skeleton, different steps', slug: 'template-method'},
  {name: 'Visitor', purpose: 'New reports on a stable tree', slug: 'visitor'},
];

export const CONFUSED_TWINS: {title: string; left: string; right: string; remember: string}[] = [
  {
    title: 'Factory vs Builder',
    left: 'Factory: which class? UPI vs NEFT.',
    right: 'Builder: how do I fill 12 fields on one class?',
    remember: 'Type vs construction.',
  },
  {
    title: 'Factory Method vs Abstract Factory',
    left: 'Factory Method: one product, many brands (the rail).',
    right: 'Abstract Factory: a whole matching kit (India vs US pack).',
    remember: 'One object vs a family.',
  },
  {
    title: 'Adapter vs Facade',
    left: 'Adapter: two APIs that do not fit. NPCI SDK → our gateway.',
    right: 'Facade: many APIs, one button. Pay hides eight services.',
    remember: 'Translate vs hide.',
  },
  {
    title: 'Proxy vs Decorator',
    left: 'Proxy: you may not enter. Auth, cache, rate limit.',
    right: 'Decorator: you may enter, we add a coat. Fraud, audit, metrics.',
    remember: 'Gate vs coat.',
  },
  {
    title: 'Strategy vs State',
    left: 'Strategy: you choose the algorithm (UPI vs card).',
    right: 'State: the object’s life chooses what is legal (no refund in CREATED).',
    remember: 'You pick vs life picks.',
  },
  {
    title: 'Strategy vs Template Method',
    left: 'Strategy: swap the whole algorithm.',
    right: 'Template: the story is fixed; only a chapter changes.',
    remember: 'Whole swap vs fill-in-the-blanks.',
  },
  {
    title: 'Observer vs Mediator',
    left: 'Observer: one shout, many ears. PaymentPosted.',
    right: 'Mediator: nobody shouts; they call the hub. Settlement.',
    remember: 'Broadcast vs switchboard.',
  },
];

export const PATTERN_STORIES: PatternStory[] = [
  {
    name: 'Singleton',
    slug: 'singleton',
    category: 'Creational',
    purpose: 'One shared thing',
    inPlainWords: 'The bank has one holiday calendar and one UTR sequence. Not forty copies that drift.',
    story:
      'Priya’s debit, the fraud score, and the RBI file must agree on “is today a bank holiday?” and “what is the next UTR?” If every service calls new HolidayCalendar(), Monday in fraud is a holiday and Tuesday in ledger is not. One shared calendar. Spring already makes beans singletons — that is the production Singleton, not a hand-rolled static.',
    sayThis: 'I use Singleton when the business truly has one of something: a clock, a sequence, a holiday calendar. Spring’s default bean scope already is that.',
    dontConfuseWith: 'A singleton account-balance cache. Money is not a shared immutable. That is a bug with a design-pattern name.',
    whenNot: 'Mutable global state, per-request data, or anything you need to fake in tests without static reset gymnastics.',
  },
  {
    name: 'Factory Method',
    slug: 'factory-method',
    category: 'Creational',
    purpose: 'Pick which class',
    inPlainWords: 'Priya chose UPI. Tomorrow she chooses NEFT. Same “create payment rail,” different class.',
    story:
      'Meridian’s app does not `new UpiRail()` inside the controller. A factory looks at `method=UPI` and returns a `PaymentRail`. Add IMPS next quarter: one new class + one factory branch. The Pay button does not change.',
    sayThis: 'Factory Method when the type of object changes — card, UPI, NEFT — and callers should depend on an interface.',
    dontConfuseWith: 'Builder. Builder fills fields on one type. Factory picks the type.',
    whenNot: 'There is only one rail and there will only ever be one. Then `new` is honest.',
  },
  {
    name: 'Abstract Factory',
    slug: 'abstract-factory',
    category: 'Creational',
    purpose: 'Pick a matching family',
    inPlainWords: 'India is not “UPI plus a US ledger.” The whole kit must match: currency, rail, regulator.',
    story:
      'Meridian runs India and US. India pack: INR accounts, UPI/NEFT, RBI reporting. US pack: USD accounts, ACH/Fedwire, Fed reporting. You must not mix UPI with a USD ledger. Abstract Factory creates the whole compatible family together.',
    sayThis: 'Abstract Factory when a region or product line must create several objects that only make sense together.',
    dontConfuseWith: 'Factory Method. If only the rail changes, Factory Method is enough. Abstract Factory is the matching kit.',
    whenNot: 'One object varies and the rest of the stack is shared. Do not invent a factory-of-factories.',
  },
  {
    name: 'Builder',
    slug: 'builder',
    category: 'Creational',
    purpose: 'Assemble many optional fields',
    inPlainWords: 'A wire has twenty fields. Most are optional. A constructor with twenty arguments is how bugs hide.',
    story:
      'Priya’s payment has amount, payee VPA, remarks, GSTIN, split with her roommate, and an empty UTR until NPCI replies. A builder names each field. Compliance can require remarks without adding a new constructor overload.',
    sayThis: 'Builder when construction is messy — many optionals — and I want the call site to read like a form.',
    dontConfuseWith: 'Factory. The payment is still one class. We are not choosing UPI vs NEFT here; we are filling the form.',
    whenNot: 'Two or three required fields. A record constructor is clearer.',
  },
  {
    name: 'Prototype',
    slug: 'prototype',
    category: 'Creational',
    purpose: 'Clone a template',
    inPlainWords: 'Next month’s rent is this month’s rent with a new date. Copy the standing instruction, do not rebuild it.',
    story:
      'Priya’s landlord debit repeats on the 1st. The template already has VPA, amount, GSTIN, and fraud baseline. Cloning is cheaper than a 12-field builder every month. Deep-copy the money fields; do not copy last month’s UTR or POSTED state.',
    sayThis: 'Prototype when a template is expensive to rebuild and the next object is “that, with a few edits.”',
    dontConfuseWith: 'Shallow copy of a payment that still points at last month’s ledger lines. Identity leaks.',
    whenNot: 'If copy rules are so gnarly (nested holds, liens) that clone() becomes a second domain model.',
  },
  {
    name: 'Adapter',
    slug: 'adapter',
    category: 'Structural',
    purpose: 'Translate a foreign API',
    inPlainWords: 'NPCI’s SDK does not speak Meridian’s PaymentGateway. We wrap it so the bank never learns NPCI XML.',
    story:
      'UPI wants a different JSON than NEFT, and a 30-year CBS still speaks ISO 8583. Inside Meridian everything is `PaymentInstruction`. Adapters convert. When NPCI versions the SDK, one class changes — not the ledger.',
    sayThis: 'Adapter when I do not own the other contract and I refuse to leak it into my domain.',
    dontConfuseWith: 'Facade. Facade hides many of our services. Adapter makes one foreign shape look like ours.',
    whenNot: 'You own both sides. Change the contract. Do not adapter-forever a mess you can fix.',
  },
  {
    name: 'Bridge',
    slug: 'bridge',
    category: 'Structural',
    purpose: 'Two axes change independently',
    inPlainWords: 'Channel is SMS or email. Vendor is Twilio or SES. Those are not the same inheritance tree.',
    story:
      'If you subclass SmsTwilio, SmsSes, EmailTwilio, EmailSes you get a class explosion. Bridge: `Notification` (SMS/Email) holds a `Sender` (Twilio/SES). Add WhatsApp without touching SES. Add a new SMS vendor without touching Email.',
    sayThis: 'Bridge when two dimensions vary on their own — channel × provider, product × clearing house.',
    dontConfuseWith: 'Adapter. Adapter is “this API is the wrong shape.” Bridge is “I planned two knobs.”',
    whenNot: 'There is only one axis. Then a Strategy or a simple interface is enough.',
  },
  {
    name: 'Composite',
    slug: 'composite',
    category: 'Structural',
    purpose: 'One and many look the same',
    inPlainWords: 'A salary file is one payment to the bank and 4,000 payments to people. Same `post()` on both.',
    story:
      'Meridian’s payroll: one bulk NEFT of ₹2.1 crore, children of ₹28,000 each. Ops hits Post on the bulk. Composite posts the tree. A single Priya rent debit is just a leaf. The caller does not `if (bulk) loop else pay`.',
    sayThis: 'Composite when a tree of things should share one operation: post, reverse, total.',
    dontConfuseWith: 'A list in a for-loop. Composite is the uniform interface, not “we have an ArrayList.”',
    whenNot: 'The structure is flat and will stay flat. Recursion is cost and confusion for no gain.',
  },
  {
    name: 'Decorator',
    slug: 'decorator',
    category: 'Structural',
    purpose: 'Wrap extra behavior',
    inPlainWords: 'The ledger only books money. Fraud, audit, and metrics are coats we put on, not if-blocks inside booking.',
    story:
      '`Ledger.post(instruction)` stays pure. `FraudDecoratingLedger` scores, then calls the next. `AuditDecoratingLedger` writes an immutable line. We can run payments in a lab without fraud by not wrapping. That is Decorator: same interface, extra coat.',
    sayThis: 'Decorator when I add behavior around a core that should not know about the extras.',
    dontConfuseWith: 'Proxy. Proxy may refuse the call (auth). Decorator almost always calls through and adds work.',
    whenNot: 'A fixed 3-step orchestrator that will never be reordered. Then a method is enough.',
  },
  {
    name: 'Facade',
    slug: 'facade',
    category: 'Structural',
    purpose: 'One door for many systems',
    inPlainWords: 'Priya taps Pay. The app does not orchestrate eight microservices. One door does.',
    story:
      '`PaymentFacade.pay(request)` calls limits, fraud, rail, ledger, notify. The mobile team does not know the order. If we swap the fraud vendor, the facade changes, the button does not. If the facade starts doing HR and ATM cash too, it has become a god object — split it.',
    sayThis: 'Facade when clients should not know the choreography of subsystems.',
    dontConfuseWith: 'Adapter. One foreign API vs many of our APIs.',
    whenNot: 'The class already is the business. Naming every service FooFacade is costume jewelry.',
  },
  {
    name: 'Flyweight',
    slug: 'flyweight',
    category: 'Structural',
    purpose: 'Share tiny immutable data',
    inPlainWords: 'Four thousand salary rows all say INR. That is one Currency object, not four thousand.',
    story:
      'A statement print of 10 million lines does not allocate 10 million `new Currency("INR", 2, "₹")`. A flyweight factory caches INR, USD, EUR. Intrinsic: code, decimals, symbol. Extrinsic: the amount on that line. Mutable balances are not flyweights.',
    sayThis: 'Flyweight when a huge number of objects share the same tiny immutable metadata.',
    dontConfuseWith: 'A cache of account entities. Accounts change. Flyweight is the shared catalog: currency, country, IFSC bank name.',
    whenNot: 'Small N, or the “shared” object is mutable. Then you have a data race with extra words.',
  },
  {
    name: 'Proxy',
    slug: 'proxy',
    category: 'Structural',
    purpose: 'Guard the real object',
    inPlainWords: 'Core banking is expensive and dangerous. Something stands in front and decides if you may enter.',
    story:
      'Priya’s request hits an API-gateway / Spring Security proxy: valid token? under 100 rpm? then the ledger. Transactional `@Transactional` is a proxy too — it starts the DB transaction before your method. The ledger code does not check JWT. The proxy does.',
    sayThis: 'Proxy when I need control before the real object: auth, rate limit, lazy CBS connection, cache.',
    dontConfuseWith: 'Decorator. Gate vs coat. If the wrapper’s job is “no,” it is Proxy. If the job is “also log,” it is Decorator.',
    whenNot: 'You are adding business rules (GST, split). That is not access control.',
  },
  {
    name: 'Chain of Responsibility',
    slug: 'chain-of-responsibility',
    category: 'Behavioral',
    purpose: 'Pass through a pipeline',
    inPlainWords: 'KYC, AML, fraud, limit — each may reject. None of them should be a 200-line if-else.',
    story:
      'Priya’s ₹45,000 walks a chain. KYC says she is verified. AML says the landlord VPA is not sanctioned. Fraud is nervous but under threshold. Limit says she is within ₹1L/day. Any handler can stop the chain. Add “cool-off for new payee” next year as one new handler.',
    sayThis: 'Chain when several independent checks may approve or reject, and the set will grow.',
    dontConfuseWith: 'Decorator. Decorator always wraps and adds. Chain may stop and never call the rest.',
    whenNot: 'Two checks that will never grow. A method is easier to debug.',
  },
  {
    name: 'Command',
    slug: 'command',
    category: 'Behavioral',
    purpose: 'Turn an action into an object',
    inPlainWords: '“Debit Priya ₹45,000” is a thing we can queue, retry, audit, and replay. Not a void method that vanished.',
    story:
      'NPCI times out. If debit was a void call, we guess. If it was a `DebitCommand` with an idempotency key, we retry safely, we store it, we show it to audit. Refund is another command. Undo, for a draft, is command.unexecute().',
    sayThis: 'Command when an action has a life: queue, retry, audit, schedule, undo.',
    dontConfuseWith: 'A service method named execute(). If you cannot put it on a queue, it is not helping.',
    whenNot: 'A single in-process call with no retry and no audit. Extra classes for theatre.',
  },
  {
    name: 'Interpreter',
    slug: 'interpreter',
    category: 'Behavioral',
    purpose: 'Evaluate a tiny rule language',
    inPlainWords: 'Compliance types `amount > 50000 AND newPayee` instead of waiting for a release.',
    story:
      'Meridian’s risk team wants rules without a deploy. A tiny expression tree: amount, country, newPayee, pepFlag. Interpreter evaluates against Priya’s payment. This is not Drools. If they want joins across 12 tables, buy a rules engine or write SQL.',
    sayThis: 'Interpreter for a small in-house expression language that business can own.',
    dontConfuseWith: 'A real rules engine. Interpreter is a baby language. Do not parse English.',
    whenNot: 'The grammar is growing weekly. You will accidentally build a compiler.',
  },
  {
    name: 'Iterator',
    slug: 'iterator',
    category: 'Behavioral',
    purpose: 'Walk without exposing storage',
    inPlainWords: 'Salary file might be a CSV, a DB cursor, or an S3 stream. Posting code only knows hasNext/next.',
    story:
      '4,000 credits. Loading `List<Credit>` OOMs the batch box. An iterator streams from the file. Tomorrow the same job reads from a warehouse cursor. The posting loop does not change. Java already gave you Iterator — use it; do not invent a new one for ArrayList.',
    sayThis: 'Iterator when traversal should not leak whether this is a file, a page, or a tree.',
    dontConfuseWith: 'A for-each on an ArrayList. That already is Iterator. Pattern value appears when storage varies.',
    whenNot: 'The collection is a small list in memory. Return the list.',
  },
  {
    name: 'Mediator',
    slug: 'mediator',
    category: 'Behavioral',
    purpose: 'Talk through a hub',
    inPlainWords: 'Fraud should not import Ledger should not import Notify. They call the settlement hub.',
    story:
      'Without a mediator, fraud calls ledger, ledger calls notify, notify calls fraud “was this SMS for a reversal?” — a spaghetti cycle. A settlement mediator receives “authorized,” tells ledger to post, then tells notify. Each colleague knows only the hub. If the hub becomes “the whole bank,” split the saga.',
    sayThis: 'Mediator when too many services call each other and I want one conversation space.',
    dontConfuseWith: 'Observer. Observer is fire-and-forget broadcast. Mediator is orchestrated conversation.',
    whenNot: 'Two services. A direct call is honest. Also when the hub would know every domain on earth.',
  },
  {
    name: 'Memento',
    slug: 'memento',
    category: 'Behavioral',
    purpose: 'Snapshot and restore',
    inPlainWords: 'Ops published a bad fee table at 10:02. Restore 09:55. The live object never exposes its guts.',
    story:
      'Fee engine has a working copy. Caretaker stores mementos (versioned JSON). A bad publish of “NEFT ₹0” is rolled back. The memento is opaque to everyone except the fee engine. This is not “we have database backups.” It is in-model undo for a carefully sized object.',
    sayThis: 'Memento when I need rollback of a specific object’s state without breaking encapsulation.',
    dontConfuseWith: 'Audit log. Audit is history. Memento is a restore button.',
    whenNot: 'Huge object graphs, or you actually need event sourcing. Snapshots of the whole bank are not mementos.',
  },
  {
    name: 'Observer',
    slug: 'observer',
    category: 'Behavioral',
    purpose: 'One event, many listeners',
    inPlainWords: 'Payment posted. SMS, email, analytics, and RBI MIS all care. The ledger does not call them one by one.',
    story:
      '`PaymentPosted` is published. Listeners: NotifyService, LedgerProjection, MisFile, FraudLearn. The posting code does not import SMS. Kafka is the grown-up Observer. Ask about at-least-once, idempotent listeners, and what happens if SMS fails — posting must not roll back.',
    sayThis: 'Observer when one business fact should wake several independent reactions.',
    dontConfuseWith: 'Mediator. No one is conducting. Listeners do not talk back to complete the payment.',
    whenNot: 'You need a single transactional outcome with all side effects or none. Then it is orchestration, not events.',
  },
  {
    name: 'State',
    slug: 'state',
    category: 'Behavioral',
    purpose: 'Behavior follows lifecycle',
    inPlainWords: 'A CREATED payment cannot settle. A SETTLED payment cannot authorize. The life of the object is the rule.',
    story:
      'Priya’s payment is CREATED, then AUTHORIZED (OTP), then POSTED, then SETTLED. `refund()` in CREATED throws. `authorize()` in SETTLED throws. Each state object implements the legal verbs. This is not “we stored an enum.” The enum is data; State is behavior that changes with that data.',
    sayThis: 'State when valid operations depend on lifecycle and illegal transitions must be impossible.',
    dontConfuseWith: 'Strategy. Strategy: I chose UPI. State: the payment grew up and the rules changed.',
    whenNot: 'Two statuses and one if. A state machine library for a boolean is vanity.',
  },
  {
    name: 'Strategy',
    slug: 'strategy',
    category: 'Behavioral',
    purpose: 'Swap the algorithm',
    inPlainWords: '“Process this payment” is one verb. Card, UPI, and NEFT are different algorithms for the same verb.',
    story:
      '`PaymentProcessor.process(instruction)` is stable. `UpiStrategy` talks NPCI. `CardStrategy` talks the card scheme. `NeftStrategy` builds a file. Pricing, FX, and retry backoff are also strategies. The caller does not switch on method codes.',
    sayThis: 'Strategy when one operation has several interchangeable algorithms and we will add more.',
    dontConfuseWith: 'State (lifecycle) or Template Method (fixed story, variable chapter).',
    whenNot: 'One algorithm forever. An interface with one impl is a costume.',
  },
  {
    name: 'Template Method',
    slug: 'template-method',
    category: 'Behavioral',
    purpose: 'Same skeleton, different steps',
    inPlainWords: 'Every clearing run is validate → book → notify. NEFT books a file. RTGS books a wire. The story does not change.',
    story:
      '`ClearingJob.execute()` is final: validate(), book(), notify(). Subclasses fill book(). You cannot skip validate. That is the point of a template — the bank’s policy is the skeleton. If you need to swap the whole job, that is Strategy, not a subclass.',
    sayThis: 'Template Method when the workflow is the regulation, and only a step is the product.',
    dontConfuseWith: 'Strategy. If the whole algorithm is swappable, compose a Strategy. Do not force inheritance.',
    whenNot: 'The skeleton itself keeps changing. Inheritance will fight you. Use a pipeline of functions.',
  },
  {
    name: 'Visitor',
    slug: 'visitor',
    category: 'Behavioral',
    purpose: 'New reports on a stable tree',
    inPlainWords: 'Accounts, loans, and cards rarely gain a new type. Reports gain a new type every month. Visitors walk the old tree.',
    story:
      'Meridian’s product types are stable: Savings, Current, Loan, Card. Month-end wants GST, TDS, audit extract, customer PDF. Each report is a visitor. `account.accept(visitor)`. Add a report without editing Savings. If you add a new product every sprint, Visitor becomes a tax — use ordinary methods.',
    sayThis: 'Visitor when the object family is stable and the operations on it keep multiplying.',
    dontConfuseWith: 'Iterator (just walking) or Strategy (one algorithm). Visitor is “new operation, old types.”',
    whenNot: 'Types change more often than operations. Then double-dispatch is pain.',
  },
];

export const CATEGORIES: PatternCategory[] = ['Creational', 'Structural', 'Behavioral'];

export const CATEGORY_BLURB: Record<PatternCategory, string> = {
  Creational: 'How the bank is allowed to create objects — rails, kits, forms, templates, the one calendar.',
  Structural: 'How the bank is wired — doors, coats, translators, trees, shared catalogs.',
  Behavioral: 'How the bank talks and decides — pipelines, events, lifecycle, algorithms, reports.',
};
