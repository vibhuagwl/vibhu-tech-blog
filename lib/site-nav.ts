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

/** Single source of truth for Topics mega-menu, footer, and homepage paths. */
export const TOPIC_GROUPS:NavGroup[]=[
  {
    id:'architecture',
    title:'Architecture',
    description:'Design systems and distributed foundations',
    topics:[
      {href:'/system-design',label:'System Design',blurb:'HLD problems, estimation, Staff follow-ups'},
      {href:'/distributed-systems',label:'Distributed Systems',blurb:'Locking, messaging, resilience, consistency'},
      {href:'/distributed-locking',label:'Distributed Locking',blurb:'Redis · DB · ZK · fencing · Spring Architect'},
      {href:'/load-balancing',label:'Load Balancing',blurb:'L4/L7 · ALB/NLB · algorithms · API GW · AWS'},
      {href:'/api-gateway',label:'API Gateway',blurb:'SCG · AWS APIGW · auth · RL · HA · Architect'},
      {href:'/resilience4j',label:'Resilience4j',blurb:'CB · Retry · Bulkhead · RL · Spring · Payments · Architect'},
      {href:'/db-sharding',label:'DB Partitioning & Sharding',blurb:'SQL/NoSQL · Spring router · AWS · DR · Architect'},
      {href:'/design-patterns',label:'Design Patterns',blurb:'23 GoF patterns with revision and mock interview'},
      {href:'/complexity',label:'Complexity',blurb:'Big-O from Java code, interview framing'},
      {href:'/dsa',label:'DSA Islands & Window',blurb:'BFS/DFS islands · grouped window catalog · Java'},
      {href:'/multi-tenant',label:'Multi-Tenant SaaS',blurb:'JWT · RLS · Redis · Kafka · Hybrid · Architect'},
      {href:'/rate-limiter',label:'Distributed Rate Limiter',blurb:'Token bucket · Redis Lua · multi-level · 429 · Architect'},
    ],
  },
  {
    id:'platform',
    title:'Platform & Ops',
    description:'Production incidents and runtime performance',
    topics:[
      {href:'/realtime-issues',label:'Real-Time Issues',blurb:'Stuck threads, DB, Kafka, migrations, lead stories'},
      {href:'/production-troubleshooting',label:'Prod Troubleshooting',blurb:'Incident playbook · JVM · DB · AWS · 50 scenarios'},
      {href:'/git-guide',label:'Git Master Guide',blurb:'Commands · rebase · hotfix · reflog · Architect'},
      {href:'/cost-optimization',label:'Cloud Cost Optimization',blurb:'FinOps · capacity · NAT · amplification · TCO · Architect'},
      {href:'/performance',label:'Performance',blurb:'Latency, scale, cache, JVM, backpressure'},
      {href:'/jpmc-experience',label:'JPMC Experience',blurb:'Hadron, tax, RSU, Kafka, platform delivery'},
      {href:'/spring-security',label:'Spring Security',blurb:'JWT, OAuth, CSRF, CORS, OIDC, XSS, SQLi, DDoS, JPA N+1'},
      {href:'/encryption',label:'Encryption & Decryption',blurb:'PKI · 5 rooms · AES-GCM · CA · mTLS · Architect'},
      {href:'/camunda',label:'Camunda 8 BPMN',blurb:'Zeebe · Workers · Saga · Operate · Payment · Architect'},
    ],
  },
  {
    id:'data',
    title:'Data & Messaging',
    description:'Kafka, Redis, and payment correctness',
    topics:[
      {href:'/kafka-interview',label:'Kafka',blurb:'Internals board, production deploy, optimization, realtime'},
      {href:'/kafka-internals',label:'Kafka Internals',blurb:'Replication · partitions · instance count · consumer replay'},
      {href:'/hadron-dlq',label:'Hadron CashLines DLQ',blurb:'Kafka · Retry · Ordering · Replay · Interview'},
      {href:'/redis-interview',label:'Redis',blurb:'Caching, HA, locks, Staff interview bank'},
      {href:'/distributed-caching',label:'Distributed Caching',blurb:'Spring · Redis · Caffeine · stampede · Architect'},
      {href:'/bloom-filter',label:'Bloom Filter',blurb:'Bits · FPP · Spring · SSTable · Kafka · Architect'},
      {href:'/fintech',label:'FinTech',blurb:'Payments, idempotency, ledgers'},
    ],
  },
  {
    id:'career',
    title:'Career & Tools',
    description:'Behavioral answers and hands-on practice',
    topics:[
      {href:'/behavioral-interview',label:'Behavioral Interview',blurb:'Staff+ STAR bank and ownership stories'},
      {href:'/leadership-principles',label:'Leadership Principles',blurb:'Amazon LPs with follow-ups'},
      {href:'/behavior',label:'Behavior Stories',blurb:'Conflict, ownership, production incidents'},
      {href:'/java-compiler',label:'Java Compiler',blurb:'Monaco IDE · local JDK compile & run'},
      {href:'/java-versions',label:'Java Versions',blurb:'8→11→17→21→25 · migration · Architect interview'},
      {href:'/java-locking',label:'Java Locking',blurb:'Locks · atomics · races · interview lab'},
      {href:'/java-concurrency',label:'Java Concurrency',blurb:'JMM · pools · CF · VT · Java 25 · Principal'},
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

export function isNavActive(pathname:string|null,href:string){
  if(!pathname) return false;
  if(href==='/') return pathname==='/';
  return pathname===href || pathname.startsWith(`${href}/`);
}

export function findActiveTopicGroup(pathname:string|null){
  if(!pathname) return null;
  return TOPIC_GROUPS.find((g)=>g.topics.some((t)=>isNavActive(pathname,t.href))) ?? null;
}
