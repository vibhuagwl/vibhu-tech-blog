import type {InterviewQ} from './types';

const q = (
  partial: Omit<InterviewQ, 'id'> & {id?: string},
  i: number,
): InterviewQ => ({
  id: partial.id ?? `gof-q-${i}`,
  ...partial,
});

const RAW: Omit<InterviewQ, 'id'>[] = [
  {
    level: 'basic',
    topic: 'Creational',
    question: 'What problem does Factory Method solve that new Concrete() does not?',
    answer30s: 'Callers depend on an interface; the factory picks the concrete rail/gateway.',
    answer2m:
      'In payments, controllers should not new UpiGateway(). Factory Method maps method=UPI|NEFT to PaymentGateway. Adding IMPS is one class + registry entry. That is OCP for object creation.',
    followUps: ['Factory Method vs Simple Factory?', 'Factory vs Strategy?'],
    wrongAnswer: 'Factory is just a place to put constructors for style.',
  },
  {
    level: 'basic',
    topic: 'Structural',
    question: 'Adapter vs Facade in one sentence each.',
    answer30s: 'Adapter translates one foreign API; Facade hides many of our APIs behind one door.',
    answer2m:
      'NPCI SDK → PaymentGateway is Adapter. PaymentFacade.pay calling fraud+ledger+notify is Facade. Interviewers listen for translate vs hide.',
    followUps: ['When do you skip Adapter?', 'God facade smell?'],
    wrongAnswer: 'They are the same — both wrap stuff.',
  },
  {
    level: 'intermediate',
    topic: 'Structural',
    question: 'Proxy vs Decorator — gate vs coat.',
    answer30s: 'Proxy may refuse the call; Decorator almost always calls through and adds work.',
    answer2m:
      'Auth/rate-limit before ledger is Proxy. Fraud scoring then delegate is Decorator. Spring @Transactional is a proxy. Mixing the names loses the access-control intent.',
    followUps: ['Virtual proxy example?', 'AOP vs explicit decorator?'],
    wrongAnswer: 'Decorator checks JWT.',
    trick: 'If the wrapper’s primary job is “no,” it is Proxy.',
  },
  {
    level: 'intermediate',
    topic: 'Behavioral',
    question: 'Strategy vs State with a payment example.',
    answer30s: 'Strategy: you pick UPI vs card. State: lifecycle picks what verbs are legal.',
    answer2m:
      'PaymentStrategy.pay swaps algorithms. PaymentState makes refund illegal in CREATED. Mixing them produces switch soup on both method and status.',
    followUps: ['How do you persist State?', 'Strategy registry in Spring?'],
    wrongAnswer: 'State is just an enum field.',
  },
  {
    level: 'senior',
    topic: 'Behavioral',
    question: 'How do you implement Observer for PaymentPosted without rolling back money when SMS fails?',
    answer30s: 'Publish after commit (outbox → Kafka); listeners idempotent; SMS failures go to retry/DLQ.',
    answer2m:
      'In-process listeners inside the DB transaction couple notify to money. Use AFTER_COMMIT or transactional outbox. Consumers use event id idempotency. That is grown-up Observer.',
    followUps: ['Outbox vs CDC?', 'Mediator vs Observer here?'],
    wrongAnswer: 'Call NotifyService synchronously inside ledger.post txn.',
    trick: 'At-least-once delivery requires idempotent listeners.',
  },
  {
    level: 'senior',
    topic: 'Creational',
    question: 'When is Abstract Factory worth it over Factory Method?',
    answer30s: 'When a region/product line must create several objects that only make sense together.',
    answer2m:
      'India pack: INR + UPI + RBI. US pack: USD + ACH + Fed. Factory Method picks one rail; Abstract Factory prevents UPI+USD ledger mixes by construction.',
    followUps: ['How do you test family invariants?', 'Profiles per region?'],
    wrongAnswer: 'Always use Abstract Factory for every factory.',
  },
  {
    level: 'lead',
    topic: 'Structural',
    question: 'Composite salary file posts 4,000 leaves — design partial failure.',
    answer30s: 'Per-leaf idempotency + status; compensate or resume; do not pretend one DB txn across rails.',
    answer2m:
      'Uniform post() is Composite’s gift; failure handling is the tax. Track leaf state, checkpoint, compensating reverse for posted siblings if business requires all-or-nothing at bulk level — often a saga, not a local txn.',
    followUps: ['Iterator + Composite together?', 'Flyweight currency in the same job?'],
    wrongAnswer: 'One @Transactional around the whole tree including external NEFT.',
  },
  {
    level: 'lead',
    topic: 'Behavioral',
    question: 'Would you use classic Visitor in Java 21 for account reports?',
    answer30s: 'Only if types are very stable and ops explode; else sealed types + pattern switch.',
    answer2m:
      'Visitor shines when Savings/Loan/Card rarely change but GST/TDS/audit grow monthly. If product types churn, Visitor taxes every addition. Sealed interfaces + switch can replace double dispatch with clearer exhaustiveness.',
    followUps: ['Show accept/visit skeleton', 'Month-end job packaging'],
    wrongAnswer: 'Always Visitor for any report.',
  },
  {
    level: 'scenario',
    topic: 'Meridian Bank',
    question: 'Priya pays rent — name 8 patterns you touch before money settles.',
    answer30s: 'Facade, Proxy, Builder, Factory, Strategy, Adapter, Chain, Command (then State/Observer…).',
    answer2m:
      'Pay button Facade; Proxy auth; Builder payload; Factory/Strategy rail; Adapter to NPCI; Chain KYC/AML/fraud; debit Command; State transitions; Observer notifies. The master story is the answer key.',
    followUps: ['Where does Decorator sit?', 'Singleton holiday calendar?'],
    wrongAnswer: 'List pattern names with no payment scene.',
  },
  {
    level: 'scenario',
    topic: 'Production',
    question: 'Singleton holiday calendar drifts between fraud and ledger pods — what broke?',
    answer30s: 'Process singleton is per JVM; cluster needs shared source of truth.',
    answer2m:
      'Each pod has its own Singleton. Load calendars from a versioned shared store (DB/config service) or pin versions. Classic Singleton never gave cluster-wide uniqueness.',
    followUps: ['UTR sequence across pods?', 'Spring bean vs enum singleton?'],
    wrongAnswer: 'Add synchronized to getInstance and it becomes cluster-safe.',
    trick: 'JVM singleton ≠ distributed singleton.',
  },
];

export const INTERVIEW_ALL: InterviewQ[] = RAW.map((r, i) => q(r, i));
export const BASIC = INTERVIEW_ALL.filter((x) => x.level === 'basic');
export const INTERMEDIATE = INTERVIEW_ALL.filter((x) => x.level === 'intermediate');
export const SENIOR = INTERVIEW_ALL.filter((x) => x.level === 'senior');
export const LEAD = INTERVIEW_ALL.filter((x) => x.level === 'lead');
export const SCENARIO = INTERVIEW_ALL.filter((x) => x.level === 'scenario');
