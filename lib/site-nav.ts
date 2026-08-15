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
    memory:'TRICKS-OLD',
    href:'/microservice-communication',
    story:'Service A calls B — sync vs async, Feign/gRPC/Kafka, timeouts, retry storms, webhooks.',
    diagram:'A → REST/gRPC → B   ·   A → Kafka → B   ·   PSP → webhook → A',
    related:[
      {href:'/resilience4j',label:'Resilience4j'},
      {href:'/api-gateway',label:'API Gateway'},
      {href:'/microservices-patterns',label:'Patterns catalog'},
    ],
  },
  {
    id:'cap',
    step:'02',
    title:'Consistency trade-offs',
    memory:'CAP + PACELC',
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
    ],
  },
  {
    id:'incidents',
    step:'04',
    title:'Production incidents',
    memory:'Symptoms → metrics → fix',
    href:'/realtime-issues',
    story:'Stuck threads, slow DB, Kafka lag — speak like an on-call lead with a playbook.',
    diagram:'Alert → triage → mitigate → root cause → permanent fix',
    related:[
      {href:'/production-troubleshooting',label:'Prod playbook'},
      {href:'/performance',label:'Performance'},
    ],
  },
  {
    id:'design',
    step:'05',
    title:'System design whiteboard',
    memory:'Req → capacity → design → fail',
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
    memory:'STAR + ownership',
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

/** Slim Topics mega-menu — hubs only; satellites live under path “related”. */
export const TOPIC_GROUPS:NavGroup[]=[
  {
    id:'start',
    title:'Start here',
    description:'Story + diagram interview paths',
    topics:[
      {href:'/microservice-communication',label:'Microservice Communication',blurb:'A→B stories · TRICKS-OLD · Staff'},
      {href:'/cap-theorem',label:'CAP Theorem',blurb:'Story theater · PACELC · whiteboard'},
      {href:'/kafka-interview',label:'Kafka',blurb:'Producer · consumer · DLQ · lag'},
      {href:'/realtime-issues',label:'Real-Time Issues',blurb:'On-call curricula · stuck threads · DB'},
      {href:'/system-design',label:'System Design',blurb:'HLD · estimation · Staff follow-ups'},
      {href:'/behavioral-interview',label:'Behavioral Interview',blurb:'STAR bank · ownership'},
    ],
  },
  {
    id:'architecture',
    title:'Architecture',
    description:'Design building blocks',
    topics:[
      {href:'/microservices-patterns',label:'Microservices Patterns',blurb:'Saga · outbox · patterns map'},
      {href:'/resilience4j',label:'Resilience4j',blurb:'CB · retry · bulkhead'},
      {href:'/distributed-locking',label:'Distributed Locking',blurb:'Redis · fencing · Spring'},
      {href:'/api-gateway',label:'API Gateway',blurb:'SCG · auth · rate limit'},
      {href:'/load-balancing',label:'Load Balancing',blurb:'L4/L7 · algorithms'},
      {href:'/design-patterns',label:'Design Patterns',blurb:'GoF · revision · mock'},
      {href:'/distributed-systems',label:'Distributed Systems',blurb:'Curriculum guides'},
      {href:'/db-sharding',label:'DB Sharding',blurb:'Partition · router · DR'},
    ],
  },
  {
    id:'platform',
    title:'Platform & Java',
    description:'Runtime, security, Spring',
    topics:[
      {href:'/production-troubleshooting',label:'Prod Troubleshooting',blurb:'50 incident scenarios'},
      {href:'/spring-security',label:'Spring Security',blurb:'JWT · OAuth · CSRF · CORS'},
      {href:'/spring-annotations',label:'Spring Annotations',blurb:'Proxies · @Transactional'},
      {href:'/java-concurrency',label:'Java Concurrency',blurb:'JMM · pools · virtual threads'},
      {href:'/encryption',label:'Encryption',blurb:'TLS · AES-GCM · mTLS'},
      {href:'/performance',label:'Performance',blurb:'Measure · bottleneck · Java/AWS'},
      {href:'/redis-interview',label:'Redis',blurb:'Cache · locks · HA'},
      {href:'/java-compiler',label:'Java Compiler',blurb:'Live IDE practice'},
    ],
  },
  {
    id:'more',
    title:'More labs',
    description:'Deeper drills when you need them',
    topics:[
      {href:'/fintech',label:'FinTech',blurb:'Payments · idempotency'},
      {href:'/distributed-caching',label:'Distributed Caching',blurb:'Stampede · Spring cache'},
      {href:'/rate-limiter',label:'Rate Limiter',blurb:'Token bucket · Redis'},
      {href:'/multi-tenant',label:'Multi-Tenant SaaS',blurb:'JWT · RLS · isolation'},
      {href:'/dsa',label:'DSA Islands & Window',blurb:'Patterns · Java'},
      {href:'/complexity',label:'Complexity',blurb:'Big-O from code'},
      {href:'/leadership-principles',label:'Leadership Principles',blurb:'Amazon LPs'},
      {href:'/git-guide',label:'Git Master Guide',blurb:'Rebase · hotfix · reflog'},
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
