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
    'Interview mastery board (producer, consumer, DLQ/DLT, Spring Kafka annotations, cluster, infra, properties) plus code, optimization, payment DLQ story, and Hadron DLQ.',
  basePath:'/kafka-interview',
  sections:[
    {
      id:'mastery',
      number:'00',
      title:'Interview Mastery',
      blurb:'Interview map + spoken answers — sizing/monitoring/incidents on Infra board.',
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
      id:'dlq',
      number:'D1',
      title:'DLQ / DLT / Retry',
      blurb:'Unified final page: classification, retry topics, Spring handlers, payments demo, Hadron CashLines.',
      href:'/kafka-dlq',
      mode:'learn' as const,
    },
    {
      id:'ska',
      number:'A1',
      title:'Spring Kafka Annotations',
      blurb:'@KafkaListener, @RetryableTopic, @DltHandler, @SendTo, @Transactional — lifecycle and interactions only.',
      href:'/spring-kafka-annotations',
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
      id:'infra',
      number:'I1',
      title:'Production Infrastructure',
      blurb:'Brokers/partitions/consumers · multi-AZ/DR · capacity · incidents · Staff answers.',
      href:'/kafka-infra',
      mode:'learn' as const,
    },
    {
      id:'production',
      number:'P2',
      title:'Production Deploy & Security',
      blurb:'KRaft · TLS/SASL · ACLs · secrets · K8s · monitoring · DR — kafka-production/ repo.',
      href:'/kafka-production',
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
      href:'/kafka-properties',
      mode:'learn' as const,
    },
  ] satisfies HubSection[],
};
