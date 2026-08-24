export type NavTopic={
  href:string;
  label:string;
  blurb:string;
};

export type NavGroup={
  id:string;
  title:string;
  description:string;
  topics:NavTopic[];
};

export type InterviewPath={
  id:string;
  step:string;
  title:string;
  memory:string;
  href:string;
  story:string;
  diagram:string;
  related:{href:string;label:string}[];
};

/**
 * Primary interview journeys — story + diagram hubs first.
 * Home and Learn lead with these instead of dumping every topic.
 */
export const INTERVIEW_PATHS:InterviewPath[]=[
  {
    id:'talk',
    step:'01',
    title:'How services talk',
    memory:'Timeout · retry · CB',
    href:'/microservice-communication',
    story:'Service A calls B — sync vs async, Feign/gRPC/Kafka, timeouts, retry storms, webhooks.',
    diagram:'A → REST/gRPC → B   ·   A → Kafka → B   ·   PSP → webhook → A',
    related:[
      {href:'/resilience4j',label:'Resilience patterns'},
      {href:'/api-gateway',label:'API Gateway'},
      {href:'/microservices-patterns',label:'Patterns catalog'},
    ],
  },
  {
    id:'cap',
    step:'02',
    title:'Consistency trade-offs',
    memory:'Partition → CP or AP',
    href:'/cap-theorem',
    story:'Partition happens — pick availability or consistency; then latency vs consistency when healthy.',
    diagram:'Partition? → AP or CP   ·   Else → latency vs consistency (PACELC)',
    related:[
      {href:'/distributed-systems',label:'Distributed Systems'},
      {href:'/distributed-locking',label:'Distributed Locking'},
    ],
  },
  {
    id:'kafka',
    step:'03',
    title:'Events & Kafka',
    memory:'Outbox · lag · DLQ',
    href:'/kafka-interview',
    story:'Fan-out, ordering per key, consumer lag, poison messages — draw the topic/partition path.',
    diagram:'Producer → topic/partitions → consumer group → DLQ',
    related:[
      {href:'/kafka-producer',label:'Producer'},
      {href:'/kafka-consumer',label:'Consumer'},
      {href:'/kafka-dlq',label:'DLQ'},
      {href:'/spring-kafka-annotations',label:'Spring Kafka annotations'},
    ],
  },
  {
    id:'incidents',
    step:'04',
    title:'Production incidents',
    memory:'Alert → triage → fix',
    href:'/realtime-issues',
    story:'Stuck threads, slow DB, Kafka lag — speak like an on-call lead with a playbook.',
    diagram:'Alert → triage → mitigate → root cause → permanent fix',
    related:[
      {href:'/production-troubleshooting',label:'Troubleshooting'},
      {href:'/performance',label:'Performance'},
    ],
  },
  {
    id:'design',
    step:'05',
    title:'System design whiteboard',
    memory:'Req → capacity → design',
    href:'/system-design',
    story:'Clarify requirements, estimate, draw boxes, then failure and scale — Staff follow-ups.',
    diagram:'Client → GW → services → data stores → async bus',
    related:[
      {href:'/system-design/system-design-master-index',label:'Master index'},
      {href:'/load-balancing',label:'Load balancing'},
      {href:'/db-sharding',label:'Sharding'},
    ],
  },
  {
    id:'behavioral',
    step:'06',
    title:'Behavioral / leadership',
    memory:'STAR · ownership',
    href:'/behavioral-interview',
    story:'Conflict, delivery, incidents — owned outcomes, not buzzwords.',
    diagram:'Situation → Task → Action → Result → learning',
    related:[
      {href:'/leadership-principles',label:'Amazon LPs'},
      {href:'/behavior',label:'Story bank'},
      {href:'/jpmc-experience',label:'JPMC stories'},
    ],
  },
];

/**
 * Topics mega-menu — four topic pillars (presentation / IA only).
 * Hub destinations unchanged; labels and grouping improved for navigation.
 */
export const TOPIC_GROUPS:NavGroup[]=[
  {
    id:'distributed',
    title:'Distributed Systems',
    description:'Consistency, coordination, and scale',
    topics:[
      {href:'/cap-theorem',label:'CAP & Consistency',blurb:'Payment partition story · CP vs AP · simulator'},
      {href:'/distributed-systems',label:'Distributed Systems',blurb:'Locking · hashing · CDC curricula'},
      {href:'/distributed-locking',label:'Distributed Locking',blurb:'Leases · fencing · Redis/Postgres'},
      {href:'/distributed-caching',label:'Distributed Caching',blurb:'Stampede · TTL · Spring Cache'},
      {href:'/microservice-communication',label:'Service Communication',blurb:'Production decisions · FinTech · interview'},
      {href:'/microservices-patterns',label:'Microservices Patterns',blurb:'Saga · outbox · choreography'},
      {href:'/db-sharding',label:'Database Sharding',blurb:'Partition · router · DR'},
      {href:'/multi-tenant',label:'Multi-Tenant SaaS',blurb:'Isolation · RLS · tenancy'},
    ],
  },
  {
    id:'messaging',
    title:'Messaging & Traffic',
    description:'Events, edge routing, and resilience',
    topics:[
      {href:'/kafka-interview',label:'Apache Kafka',blurb:'Producer · consumer · DLQ · annotations · lag'},
      {href:'/api-gateway',label:'API Gateway',blurb:'Routing · auth · rate limits'},
      {href:'/load-balancing',label:'Load Balancing',blurb:'L4/L7 · algorithms · health'},
      {href:'/rate-limiter',label:'Rate Limiting',blurb:'Token bucket · Redis'},
      {href:'/resilience4j',label:'Resilience Patterns',blurb:'Circuit breaker · retry · bulkhead'},
      {href:'/fintech',label:'Payments & FinTech',blurb:'Idempotency · settlement flows'},
    ],
  },
  {
    id:'java-spring',
    title:'Java & Spring',
    description:'Runtime, framework, security, and data',
    topics:[
      {href:'/spring-annotations',label:'Spring Annotations',blurb:'Proxies · transactions · DI'},
      {href:'/spring-security',label:'Spring Security',blurb:'JWT · OAuth2 · CSRF · CORS'},
      {href:'/java-concurrency',label:'Java Concurrency',blurb:'JMM · pools · virtual threads'},
      {href:'/java-executor',label:'Executor Framework',blurb:'TPE algorithm · payment pool sizing'},
      {href:'/java-streams',label:'Java Streams',blurb:'Top 100 tough · Priority 15 · Staff'},
      {href:'/java-locking',label:'JVM Locking',blurb:'synchronized · locks · JUC'},
      {href:'/redis-interview',label:'Redis',blurb:'Cache · locks · high availability'},
      {href:'/encryption',label:'Encryption & TLS',blurb:'AES-GCM · mTLS · key management'},
      {href:'/performance',label:'Performance Engineering',blurb:'Measure · bottleneck · JVM/AWS'},
      {href:'/java-compiler',label:'Java Live Compiler',blurb:'In-browser IDE practice'},
    ],
  },
  {
    id:'ops-prep',
    title:'Operations & Prep',
    description:'Incidents, whiteboard design, and soft skills',
    topics:[
      {href:'/realtime-issues',label:'Production Incidents',blurb:'Stuck threads · DB · on-call'},
      {href:'/production-troubleshooting',label:'Production Troubleshooting',blurb:'IC handbook · RCA playbooks'},
      {href:'/system-design',label:'System Design',blurb:'HLD · estimation · failure modes'},
      {href:'/gof-design-patterns',label:'GoF Design Patterns',blurb:'Problem-first · flashcards · payment stories'},
      {href:'/design-patterns',label:'Design Patterns Hub',blurb:'GoF · revision · mock interview'},
      {href:'/behavioral-interview',label:'Behavioral Interview',blurb:'STAR stories · ownership'},
      {href:'/leadership-principles',label:'Leadership Principles',blurb:'Amazon leadership principles'},
      {href:'/dsa',label:'DSA Patterns',blurb:'Islands · sliding window · Java'},
      {href:'/complexity',label:'Time & Space Complexity',blurb:'Big-O from production code'},
      {href:'/git-guide',label:'Git Mastery',blurb:'Rebase · hotfix · reflog'},
    ],
  },
];

export const PRIMARY_LINKS=[
  {href:'/learn',label:'Learn'},
  {href:'/interview-questions',label:'Practice'},
  {href:'/about',label:'About'},
] as const;

export function allTopics():NavTopic[]{
  return TOPIC_GROUPS.flatMap((g)=>g.topics);
}

/** Paths that belong under the single Kafka hub entry in Topics. */
const KAFKA_FAMILY_PREFIXES=[
  '/kafka-interview',
  '/kafka-mastery',
  '/kafka-producer',
  '/kafka-consumer',
  '/kafka-cluster',
  '/kafka-dlq',
  '/kafka-infra',
  '/kafka-properties',
  '/kafka-internals',
  '/hadron-dlq',
  '/spring-kafka-payments-demo',
  '/spring-kafka-annotations',
] as const;

function isKafkaFamilyPath(pathname:string){
  return KAFKA_FAMILY_PREFIXES.some(
    (p)=>pathname===p || pathname.startsWith(`${p}/`),
  );
}

export function isNavActive(pathname:string|null,href:string){
  if(!pathname) return false;
  if(href==='/') return pathname==='/';
  if(href==='/kafka-interview' && isKafkaFamilyPath(pathname)) return true;
  if(href==='/behavioral-interview' && (pathname.startsWith('/behavior') || pathname.startsWith('/leadership-principles'))) return true;
  if(href==='/microservice-communication' && pathname.startsWith('/microservices-patterns')) return false;
  if(href==='/java-concurrency' && pathname.startsWith('/java-locking')) return false;
  if(href==='/realtime-issues' && pathname.startsWith('/production-troubleshooting')) return false;
  return pathname===href || pathname.startsWith(`${href}/`);
}

export function findActiveTopicGroup(pathname:string|null){
  if(!pathname) return null;
  return TOPIC_GROUPS.find((g)=>g.topics.some((t)=>isNavActive(pathname,t.href))) ?? null;
}

export function findActivePath(pathname:string|null){
  if(!pathname) return null;
  return (
    INTERVIEW_PATHS.find(
      (p)=>pathname===p.href || pathname.startsWith(`${p.href}/`) || p.related.some((r)=>pathname===r.href || pathname.startsWith(`${r.href}/`)),
    ) ?? null
  );
}
