export type CapStory = {
  id: string;
  title: string;
  badge: string;
  hook: string;
  cast: string;
  plot: string;
  mermaid: string;
  spoken60s: string;
  whiteboard: string;
  memory: string;
  trap: string;
  choose: 'CP' | 'AP' | 'Hybrid' | 'PACELC' | 'Myth';
};

/** Easy-to-draw interview stories — lead with these, not textbook CAP. */
export const CAP_STORIES: CapStory[] = [
  {
    id: 'two-branches',
    title: 'Two bank branches, one cut phone line',
    badge: 'THE CAP story',
    hook: 'Start every CAP answer with this picture.',
    cast: 'Alice (Mumbai branch) · Bob (Delhi branch) · Phone line = network',
    plot:
      'Alice deposits ₹10,000. Phone line between branches dies. Bob asks: "What is my balance?" If Bob answers from his old ledger → Available but maybe wrong (AP). If Bob says "line is down, try later" → Consistent but unavailable (CP). You cannot promise both while the line is cut.',
    mermaid: `flowchart LR
  subgraph Mumbai
    A[Alice deposits 10k]
    LA[Ledger A = 10k]
  end
  subgraph Delhi
    B[Bob asks balance]
    LB[Ledger B = 0]
  end
  A -.->|phone CUT| B
  LA -.->|X partition| LB
  B --> Q{What do you do?}
  Q -->|CP| Reject[Sorry, try later]
  Q -->|AP| Stale[Answer 0 — stale]`,
    spoken60s:
      'CAP is about a network cut between replicas. Consistency means every client sees one correct latest value. Availability means every live node still answers. Partition tolerance means the system keeps running despite that cut. During the cut you pick: reject to stay correct, or answer and risk stale. You do not permanently "pick any two" at design time — P is assumed; the fork is C versus A when P hits.',
    whiteboard: `1. Draw two boxes + X between them
2. Write on left: WRITE
3. Write on right: READ?
4. Fork: REJECT (CP) | ANSWER STALE (AP)
5. Say: "P is not optional in multi-AZ"`,
    memory: 'Cut phone → pick Correct or Answer. Not both.',
    trap: 'Saying "we chose CA" for a multi-region bank.',
    choose: 'Myth',
  },
  {
    id: 'atm-cp',
    title: 'ATM withdraw while regions split',
    badge: 'CP story',
    hook: 'Money must not invent itself.',
    cast: 'Customer · ATM · Ledger primary (AZ-1) · Replica (AZ-2)',
    plot:
      'Balance is ₹5,000. Network splits. If both AZs allow withdraw of ₹5,000 → double spend. CP ATM: only the majority side that can confirm the ledger serves cash; minority returns "unavailable". Customer hates the error more than a wrong free ₹5,000 — bank prefers the error.',
    mermaid: `sequenceDiagram
  participant U as Customer
  participant ATM as ATM AZ-2
  participant L as Ledger majority AZ-1
  Note over ATM,L: Partition — AZ-2 cannot reach majority
  U->>ATM: Withdraw 5000
  ATM->>L: Confirm balance?
  L--xATM: TIMEOUT
  ATM-->>U: 503 Unavailable (CP)
  Note over U: Painful but correct — no double cash`,
    spoken60s:
      'For ledgers I choose CP under partition: reject or queue the debit until a quorum confirms. Availability of wrong money is worse than temporary unavailability. I pair that with short timeouts, clear 503s, and async statements that can be AP.',
    whiteboard: `ATM → Quorum ledger
If no quorum → DENY withdraw
Never: both sides approve same cash`,
    memory: 'Cash = CP. Error > double money.',
    trap: 'Calling Postgres "always CA" — Multi-AZ still partitions.',
    choose: 'CP',
  },
  {
    id: 'likes-ap',
    title: 'Instagram like button during partition',
    badge: 'AP story',
    hook: 'A like can be eventually right.',
    cast: 'User · Edge cache · Like counters in two regions',
    plot:
      'User taps Like. Region A records +1. Region B is partitioned and still shows old count. Feed stays up. Later anti-entropy or CRDT merges counters. Business accepts a few seconds of wrong count; rejecting Likes would feel broken.',
    mermaid: `flowchart TD
  U[Tap Like] --> A[Region A counter = 101]
  U --> B[Region B counter = 100]
  A -.->|partition| B
  B --> Show[Still show 100 — available]
  A --> Heal[Partition heals]
  Heal --> Merge[Merge → 101]
  Merge --> Done[Everyone sees 101]`,
    spoken60s:
      'Social counters are AP-oriented: keep serving, accept temporary divergence, converge later. I still protect money and abuse checks with stronger paths. CAP choice is per use-case inside one product, not one stamp for Instagram.',
    whiteboard: `Like → local write OK
Show stale OK
Heal → merge
Money path elsewhere = CP`,
    memory: 'Likes can lie briefly. Money cannot.',
    trap: 'Eventual consistency means no consistency.',
    choose: 'AP',
  },
  {
    id: 'concert-seats',
    title: 'Last concert seat — two buyers',
    badge: 'CP ticket story',
    hook: 'Oversell is a lawsuit; 503 is a retry.',
    cast: 'Buyer A · Buyer B · Seat row lock / inventory service',
    plot:
      'One seat left. Partition splits inventory. AP would sell twice. CP: only the side with the seat lease/quorum sells; the other returns sold-out or retry. Payment may still be saga-compensated if auth succeeds after inventory fails.',
    mermaid: `flowchart LR
  Seat[Seat S1 qty=1]
  A[Buyer A]
  B[Buyer B]
  A --> Q{Quorum holds seat?}
  B --> Q
  Q -->|yes majority| Sold[Sell once]
  Q -->|minority| No[503 / sold out]
  Sold --> Pay[Payment saga]
  No --> Retry[Retry / waitlist]`,
    spoken60s:
      'Inventory for unique seats is CP: conditional update or lease with fencing. I do not make the shopping UI AP if that means double-booking. Catalog browse can be AP; checkout reservation is strong.',
    whiteboard: `Browse AP · Reserve CP · Pay idempotent
Seat: compare-and-set qty 1→0`,
    memory: 'Unique seat = one winner. CP reservation.',
    trap: 'Caching seat availability without fencing.',
    choose: 'CP',
  },
  {
    id: 'cart-vs-pay',
    title: 'Cart is soft · Payment is hard',
    badge: 'Hybrid story',
    hook: 'Same checkout, two CAP moods.',
    cast: 'Cart service · Inventory · Payment · Notification',
    plot:
      'Cart items can be slightly stale (AP). Payment authorization and ledger debit are CP/idempotent. Order status propagates eventually. Interview gold: "I slice the system — not one CAP label."',
    mermaid: `flowchart TB
  subgraph AP_zone [AP-tolerant]
    Cart[Cart / catalog]
    Notify[Email / push]
    Search[Search index]
  end
  subgraph CP_zone [CP-critical]
    Inv[Inventory reserve]
    Pay[Payment auth + ledger]
  end
  Cart --> Inv
  Inv --> Pay
  Pay --> Notify
  Pay --> Search`,
    spoken60s:
      'I never answer CAP with one acronym for the whole product. Cart and notifications lean AP. Inventory reservation and payment lean CP with idempotency keys. That hybrid is how real systems stay usable without corrupting money.',
    whiteboard: `Draw boxes: AP | CP | AP
Arrow: cart → reserve → pay → notify
Say hybrid out loud`,
    memory: 'One product · many CAP choices.',
    trap: 'Forcing entire e-commerce onto Cassandra ONE.',
    choose: 'Hybrid',
  },
  {
    id: 'quorum-vote',
    title: 'Three judges must agree',
    badge: 'Quorum story',
    hook: 'N=3, W=2, R=2 — draw the Venn.',
    cast: 'Replicas R1 R2 R3 · Writer · Reader',
    plot:
      'Write waits for any 2 replicas. Read waits for any 2. Overlap guarantees the reader meets at least one fresh writer — usually. Still not automatic linearizability without careful protocols (timestamps, read repair, consensus).',
    mermaid: `flowchart TB
  W[Write W=2] --> R1
  W --> R2
  R[Read R=2] --> R2
  R --> R3
  R1((R1))
  R2((R2 fresh))
  R3((R3))
  Note1[Overlap at R2 → reader can see write]
  R2 --- Note1`,
    spoken60s:
      'Quorum rule of thumb is R+W>N so read and write sets intersect. That helps strong reads but is not a free linearizability certificate — clocks, concurrent writes, and partial failures still need a real protocol. For interviews I say: quorum is necessary overlap, consensus/leader is how we make it safe.',
    whiteboard: `N=3 circle
Shade W=2 and R=2
Intersect → explain
Caveat: not auto-linearizable`,
    memory: 'R+W>N = meet in the middle. Not magic.',
    trap: 'Quorum automatically means linearizability.',
    choose: 'CP',
  },
  {
    id: 'two-ceos',
    title: 'Two CEOs after the phone dies',
    badge: 'Split-brain story',
    hook: 'Both sides think they are primary.',
    cast: 'Primary A · Primary B (imposter) · Clients on both sides',
    plot:
      'Network cuts. Both nodes promote themselves. Divergent writes. Fix: quorum election, fencing tokens, STONITH — minority must not accept writes. Redis async replica + bad failover is a classic footgun.',
    mermaid: `flowchart LR
  subgraph Left
    PA[CEO A writes X=1]
  end
  subgraph Right
    PB[CEO B writes X=2]
  end
  PA -.->|CUT| PB
  PA --> Div[Divergent truth]
  PB --> Div
  Fix[Fence: only quorum CEO writes]`,
    spoken60s:
      'Split brain is two leaders accepting writes during a partition. Prevention is majority quorum plus fencing so the old leader\'s writes are rejected after failover. Availability of both sides is exactly the danger.',
    whiteboard: `Two crowns
X between them
Cross out dual write
Fence token++`,
    memory: 'Two crowns = disaster. One fence.',
    trap: 'Failover without fencing.',
    choose: 'CP',
  },
  {
    id: 'pacelc-highway',
    title: 'Highway open vs highway blocked',
    badge: 'PACELC story',
    hook: 'CAP is the accident; PACELC is daily traffic.',
    cast: 'Cross-region DB · Sync replication · Async replica',
    plot:
      'If Partition: still C vs A. Else (healthy): Latency vs Consistency — wait for the remote region (strong, slow) or return local (fast, maybe stale). Multi-region always lives in PACELC.',
    mermaid: `flowchart TD
  Start{Partition?}
  Start -->|Yes| PA{C or A?}
  PA -->|C| CP[Reject / quorum]
  PA -->|A| AP[Local answer]
  Start -->|No| EL{Latency or Consistency?}
  EL -->|L| Fast[Async / local read]
  EL -->|C| Slow[Sync / quorum read]`,
    spoken60s:
      'CAP alone is incomplete. PACELC adds: when the network is fine, you still trade latency versus consistency — especially cross-region. I design for both the accident and the daily commute.',
    whiteboard: `If P → C|A
Else → L|C
Circle multi-region`,
    memory: 'Accident = CAP. Commute = PACELC.',
    trap: 'Stopping the answer after naming CP/AP.',
    choose: 'PACELC',
  },
  {
    id: 'kafka-acks',
    title: 'Kafka post office receipts',
    badge: 'Kafka story',
    hook: 'Do not stamp Kafka CP or AP — stamp the receipt.',
    cast: 'Producer · Leader · ISR followers',
    plot:
      'acks=0: fire and forget (max A, weak durability). acks=1: leader got it. acks=all + min.insync.replicas: every in-sync follower got it — more CP at produce time. Unclean leader election trades availability for possible data loss.',
    mermaid: `flowchart LR
  P[Producer] -->|acks=0| Void[No wait]
  P -->|acks=1| L[Leader only]
  P -->|acks=all| ISR[Leader + ISR]
  ISR --> Safe[Durable among ISR]
  Unclean[Unclean election] --> Risk[May lose commits]`,
    spoken60s:
      'Kafka\'s CAP mood is a knob: acks and min.ISR decide whether produce prefers durability/consistency or availability/latency. I never say "Kafka is AP" — I say what happens when ISR shrinks and unclean election is on or off.',
    whiteboard: `acks 0 / 1 / all
min.ISR
unclean on/off → loss?`,
    memory: 'Kafka CAP = receipt settings, not a tattoo.',
    trap: 'Kafka is AP.',
    choose: 'Hybrid',
  },
  {
    id: 'saga-restaurant',
    title: 'Restaurant ticket chain (Saga)',
    badge: 'Saga story',
    hook: 'No global 2PC across kitchens.',
    cast: 'Order · Kitchen · Payment · Delivery',
    plot:
      'Order service books kitchen, then payment, then delivery. If payment fails after kitchen accepted → compensate (cancel kitchen). Under partition you get eventual consistency with compensations — not a single ACID lock across services.',
    mermaid: `sequenceDiagram
  participant O as Order
  participant K as Kitchen
  participant P as Payment
  participant D as Delivery
  O->>K: Reserve slot
  K-->>O: OK
  O->>P: Charge
  P--xO: FAIL / timeout
  O->>K: Compensate cancel
  Note over O,D: No 2PC — local tx + saga`,
    spoken60s:
      'Across microservices I avoid 2PC for availability. Saga gives local transactions plus compensations — availability with eventual consistency. Money still needs idempotency and careful compensation design.',
    whiteboard: `Happy path arrows
Failure → compensate arrow
Say: not XA`,
    memory: 'Saga = book steps · undo steps. Not one big lock.',
    trap: 'Distributed 2PC across 10 services for "consistency".',
    choose: 'AP',
  },
  {
    id: 'ride-location',
    title: 'Driver pin on the map',
    badge: 'Ride-sharing story',
    hook: 'Location AP · trip state stronger.',
    cast: 'Driver GPS · Rider app · Trip FSM · Payment',
    plot:
      'Driver location can be seconds stale (AP). Trip state transitions (accepted → arrived → completed) need clearer ordering. Payment is CP/idempotent. Again: slice.',
    mermaid: `flowchart TB
  GPS[GPS pings] -->|AP OK| Map[Map pin maybe 3s late]
  Trip[Trip state machine] -->|stronger| FSM[Single writer / version]
  Pay[Payment] -->|CP + idempotency| Ledger`,
    spoken60s:
      'For rides: location feed is AP; trip state is versioned/leader-ish; payment is strongly consistent and idempotent. CAP answer is a story with three layers, not one word.',
    whiteboard: `Three layers: pin / trip / pay
Label AP / strong / CP`,
    memory: 'Pin can drift. Fare cannot.',
    trap: 'One Cassandra cluster stamped AP for everything.',
    choose: 'Hybrid',
  },
  {
    id: 'pick-two-myth',
    title: 'The broken triangle tattoo',
    badge: 'Myth buster',
    hook: 'Erase "pick any two" from the whiteboard.',
    cast: 'Junior answer · Staff answer',
    plot:
      'Junior: "CAP means choose two of three." Staff: "Once you have a network between nodes, P is required. Healthy system can look CA. Partition forces C vs A. Config changes the mood."',
    mermaid: `flowchart TD
  Bad[Pick any two ❌]
  Good[Assume P]
  Good --> Healthy[No partition: C+A possible]
  Good --> Cut[Partition: C XOR A]
  Cut --> CP[Reject]
  Cut --> AP[Serve stale]`,
    spoken60s:
      'I explicitly correct the pick-any-two meme. Partition tolerance is not a feature flag for multi-node systems. The real design question is what we do when the network lies: fail closed or fail open.',
    whiteboard: `Cross out triangle myth
Write: P assumed
Fork C|A`,
    memory: 'Triangle is a poster. Fork is the truth.',
    trap: 'Memorizing CA/CP/AP product lists only.',
    choose: 'Myth',
  },
];

export type StoryBeat = {
  id: string;
  label: string;
  say: string;
  mermaid: string;
};

/** 90-second whiteboard path — click through in interview order. */
export const WHITEBOARD_BEATS: StoryBeat[] = [
  {
    id: 'b1',
    label: '1. Draw partition',
    say: 'Two nodes, X on the wire. "This is P — it will happen in multi-AZ."',
    mermaid: `flowchart LR
  N1[Node A] -.->|CUT| N2[Node B]
  N1 --- X[partition]
  X --- N2`
  },
  {
    id: 'b2',
    label: '2. Write then read',
    say: 'Write on A, read on B. What must be true?',
    mermaid: `sequenceDiagram
  Client->>A: WRITE x=1
  Client->>B: READ x ?
  Note over A,B: Wire is cut`,
  },
  {
    id: 'b3',
    label: '3. Fork C vs A',
    say: 'CP: B refuses. AP: B answers old value. Cannot do both with a guarantee.',
    mermaid: `flowchart TD
  R[Read on B] --> F{Choose}
  F -->|Consistency| CP[503 / wait]
  F -->|Availability| AP[Return stale]`,
  },
  {
    id: 'b4',
    label: '4. Business pick',
    say: 'Money/seats → CP. Likes/feed → AP. Say the business pain.',
    mermaid: `flowchart LR
  Money[Money / seats] --> CP[CP]
  Likes[Likes / feed] --> AP[AP]`,
  },
  {
    id: 'b5',
    label: '5. Add PACELC',
    say: 'When healthy: latency vs consistency cross-region.',
    mermaid: `flowchart TD
  H{Healthy?}
  H -->|No P| CAP[C vs A]
  H -->|Yes| PAC[L vs C]`,
  },
  {
    id: 'b6',
    label: '6. Hybrid close',
    say: 'Close: "I apply CAP per subsystem, with knobs — not a product tattoo."',
    mermaid: `flowchart TB
  Product[Product]
  Product --> S1[Payment CP]
  Product --> S2[Feed AP]
  Product --> S3[Catalog AP]
  Product --> S4[Inventory CP]`,
  },
];

export const STORY_MEMORY_STRIP = [
  {title: 'Cut phone', line: 'C or A — not both'},
  {title: 'ATM', line: 'Error > double cash'},
  {title: 'Like', line: 'Stale OK briefly'},
  {title: 'Seat', line: 'One winner'},
  {title: 'Checkout', line: 'Slice CAP'},
  {title: 'Quorum', line: 'R+W>N meet'},
  {title: 'Two CEOs', line: 'Fence one'},
  {title: 'PACELC', line: 'Accident + commute'},
];
