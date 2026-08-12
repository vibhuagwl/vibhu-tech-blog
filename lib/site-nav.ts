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
      {href:'/design-patterns',label:'Design Patterns',blurb:'23 GoF patterns with revision and mock interview'},
      {href:'/complexity',label:'Complexity',blurb:'Big-O from Java code, interview framing'},
    ],
  },
  {
    id:'platform',
    title:'Platform & Ops',
    description:'Production incidents and runtime performance',
    topics:[
      {href:'/realtime-issues',label:'Real-Time Issues',blurb:'Stuck threads, DB, Kafka, migrations, lead stories'},
      {href:'/performance',label:'Performance',blurb:'Latency, scale, cache, JVM, backpressure'},
      {href:'/jpmc-experience',label:'JPMC Experience',blurb:'Hadron, tax, RSU, Kafka, platform delivery'},
      {href:'/spring-security',label:'Spring Security',blurb:'OAuth, JWT, CSRF, Authn/Authz, OIDC demos'},
    ],
  },
  {
    id:'data',
    title:'Data & Messaging',
    description:'Kafka, Redis, and payment correctness',
    topics:[
      {href:'/kafka-interview',label:'Kafka',blurb:'Architecture, optimization, properties, realtime cases'},
      {href:'/redis-interview',label:'Redis',blurb:'Caching, HA, locks, Staff interview bank'},
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
