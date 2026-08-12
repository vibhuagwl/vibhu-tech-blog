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

/** Sidebar / prev-next friendly order: hub indexes and entry guides first. */
export const KAFKA_SIDEBAR_ORDER=[
  'kafka-knowledge-index',
  'kafka-knowledge-what-is-kafka',
  'kafka-knowledge-consumer-groups',
  'kafka-experience-index',
  'kafka-experience-consumer-lag',
  'kafka-experience-rebalance',
  'kafka-optimization-index',
  'kafka-optimization-producer',
  'kafka-optimization-consumer',
  'kafka-configuration-index',
  'kafka-config-batch-size',
  'kafka-config-max-poll-records',
  'kafka-troubleshooting-index',
  'kafka-troubleshooting-consumer-lag',
  'kafka-upgrades-index',
  'kafka-upgrades-client',
  'kafka-staff-principal-interview-index',
  'kafka-cheat-sheet',
  'kafka-one-minute-revision',
  'kafka-five-minute-revision',
];

/**
 * Reusable technology-hub template.
 * Kafka is the reference implementation; other technologies can reuse the same section shape.
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
  subtitle:'Distributed event streaming',
  description:
    'Learn how Kafka works, how it behaves in production, how to optimize and configure it, how to troubleshoot and upgrade it, and how to explain it in a senior interview.',
  basePath:'/kafka-interview',
  sections:[
    {
      id:'knowledge',
      number:'01',
      title:'Kafka Knowledge',
      blurb:'Understand architecture, partitions, consumers, offsets, replication, and delivery semantics.',
      href:'/kafka-interview/kafka-knowledge-index',
      mode:'learn' as const,
    },
    {
      id:'experience',
      number:'02',
      title:'Real-World Experience',
      blurb:'Production incidents: lag, rebalances, duplication, disk pressure, and recovery decisions.',
      href:'/kafka-interview/kafka-experience-index',
      mode:'experience' as const,
    },
    {
      id:'optimization',
      number:'03',
      title:'Optimization & Performance',
      blurb:'Producer, consumer, broker, and cluster tuning with trade-offs—not random property lists.',
      href:'/kafka-interview/kafka-optimization-index',
      mode:'learn' as const,
    },
    {
      id:'configuration',
      number:'04',
      title:'Configuration Reference',
      blurb:'Producer, consumer, broker, and controller settings with when-to-change guidance.',
      href:'/kafka-interview/kafka-configuration-index',
      mode:'learn' as const,
    },
    {
      id:'troubleshooting',
      number:'05',
      title:'Troubleshooting',
      blurb:'Symptom → metrics → root cause → fix → prevention for lag, ISR, DLQ, and failures.',
      href:'/kafka-interview/kafka-troubleshooting-index',
      mode:'experience' as const,
    },
    {
      id:'upgrades',
      number:'06',
      title:'Upgrades & Compatibility',
      blurb:'Kafka, Java, Spring Kafka, clients, schemas, canary, and rollback.',
      href:'/kafka-interview/kafka-upgrades-index',
      mode:'experience' as const,
    },
    {
      id:'interview',
      number:'07',
      title:'Interview Preparation',
      blurb:'130+ Staff+/Principal questions, scenarios, and spoken answers.',
      href:'/kafka-interview/kafka-staff-principal-interview-index',
      mode:'recall' as const,
    },
    {
      id:'cheatsheet',
      number:'08',
      title:'Cheat Sheet & Revision',
      blurb:'One-page recall, 1-minute revision, and 5-minute interview revision.',
      href:'/kafka-interview/kafka-cheat-sheet',
      mode:'recall' as const,
    },
  ] satisfies HubSection[],
};
