export type HubSection={
  id:string;
  number:string;
  title:string;
  blurb:string;
  href:string;
  mode:'learn'|'experience'|'recall';
};

export type HubTopic={
  title:string;
  href:string;
  blurb?:string;
};

/** Kafka hub sidebar: MDX pages listed under /kafka-interview (standalone hubs stay off this list). */
export const KAFKA_SIDEBAR_ORDER=[
  'kafka-optimization-index',
  'kafka-properties',
  'kafka-cheat-sheet',
];

/**
 * Reusable technology-hub template (kept for other tech hubs).
 */
export const TECHNOLOGY_SECTION_TEMPLATE=[
  {id:'knowledge',number:'01',titleSuffix:'Knowledge',mode:'learn' as const},
  {id:'experience',number:'02',titleSuffix:'Real-World Experience',mode:'experience' as const},
  {id:'optimization',number:'03',titleSuffix:'Optimization & Performance',mode:'learn' as const},
  {id:'configuration',number:'04',titleSuffix:'Configuration Reference',mode:'learn' as const},
  {id:'troubleshooting',number:'05',titleSuffix:'Troubleshooting',mode:'experience' as const},
  {id:'upgrades',number:'06',titleSuffix:'Upgrades & Compatibility',mode:'experience' as const},
  {id:'interview',number:'07',titleSuffix:'Interview Preparation',mode:'recall' as const},
  {id:'cheatsheet',number:'08',titleSuffix:'Cheat Sheet & Revision',mode:'recall' as const},
];

export const KNOWLEDGE_TYPE_FILTERS=[
  'Knowledge',
  'Experience',
  'Optimization',
  'Configuration',
  'Troubleshooting',
  'Upgrade',
  'Interview',
  'Cheat Sheet',
] as const;

export const KAFKA_HUB={
  slug:'kafka',
  title:'Kafka',
  subtitle:'Practical Spring Kafka',
  description:
    'Interview mastery board (producer, consumer, cluster, monitoring, sizing) plus code, optimization, properties, payment DLQ story, Hadron DLQ, and internals.',
  basePath:'/kafka-interview',
  sections:[
    {
      id:'mastery',
      number:'00',
      title:'Interview Mastery',
      blurb:'Interview drills: monitoring, instance counts, syncing, partitions, spoken answers.',
      href:'/kafka-mastery',
      mode:'learn' as const,
    },
    {
      id:'producer',
      number:'P1',
      title:'Producer Board',
      blurb:'Complete producer: send() internals, idempotence, transactions, configs, failures, Spring.',
      href:'/kafka-producer',
      mode:'learn' as const,
    },
    {
      id:'consumer',
      number:'C1',
      title:'Consumer Board',
      blurb:'Complete consumer: poll(), groups, rebalance, commits, lag, DLQ, EOS, failures, Spring patterns.',
      href:'/kafka-consumer',
      mode:'learn' as const,
    },
    {
      id:'cluster',
      number:'B1',
      title:'Cluster & Broker',
      blurb:'KRaft, request path, ISR, storage, multi-AZ, capacity, failures, ops.',
      href:'/kafka-cluster',
      mode:'learn' as const,
    },
    {
      id:'code',
      number:'01',
      title:'Kafka Code',
      blurb:'Spring payment-api + settlement-worker source explorer.',
      href:'/spring-kafka-payments-demo',
      mode:'learn' as const,
    },
    {
      id:'optimization',
      number:'02',
      title:'Optimization',
      blurb:'End-to-end: producer → broker → controller → cluster → consumer — bottlenecks and trade-offs.',
      href:'/kafka-interview/kafka-optimization-index',
      mode:'learn' as const,
    },
    {
      id:'properties',
      number:'03',
      title:'Properties',
      blurb:'Complete Kafka 4.0 producer, consumer, broker, cluster, and controller configs with GO/NO-GO.',
      href:'/kafka-interview/kafka-properties',
      mode:'learn' as const,
    },
    {
      id:'cheatsheet',
      number:'04',
      title:'Cheatsheet & Interview',
      blurb:'Memory formulas plus 30s/90s answers from the payment story.',
      href:'/kafka-interview/kafka-cheat-sheet',
      mode:'recall' as const,
    },
    {
      id:'payment-dlq',
      number:'05',
      title:'Payment story + DLQ',
      blurb:'Controller → producer → consumer → DLQ with diagrams, curl, and Spring code.',
      href:'/realtime-issues/spring-kafka-dlq-payments',
      mode:'experience' as const,
    },
    {
      id:'hadron',
      number:'06',
      title:'Hadron DLQ',
      blurb:'Neptune → retry topics → DLQ DB → replay with ordering and idempotency.',
      href:'/hadron-dlq',
      mode:'experience' as const,
    },
    {
      id:'internals',
      number:'07',
      title:'Internals Board',
      blurb:'Partition writes, replication, production instance counts, consumer crash replay.',
      href:'/kafka-internals',
      mode:'learn' as const,
    },
  ] satisfies HubSection[],
};
