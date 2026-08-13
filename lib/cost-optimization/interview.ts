import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'How does bad Java code increase AWS cost?',answer30s:'Extra CPU/mem/DB/network/logs/retries → more instances and data plane spend.',answer2m:'N+1, fat payloads, GC, chatty calls — profile before scale.',followUps:['Example with orders/customers?'],trick:'Always buy bigger EC2 first.'},
  {id:'s2',topic:'Senior',question:'How do you estimate instance count?',answer30s:'concurrency≈RPS×latency; divide by safe capacity; add HA headroom; load-test.',answer2m:'Account for downstream limits and deploy strategy.',followUps:['Diurnal traffic?']},
  {id:'s3',topic:'Senior',question:'Fetch vs buy: when is caching worth it?',answer30s:'When cache TCO < saved DB/compute and hit ratio stays high.',answer2m:'Stampede controls required.',followUps:['Hit ratio 50% vs 90%?']},
  {id:'s4',topic:'Senior',question:'Why is NAT Gateway a cost trap?',answer30s:'Private→internet GB processed + hours; S3 via NAT is classic waste.',answer2m:'Use Gateway/Interface endpoints; map cross-AZ.',followUps:['VPC Flow Logs?']},
  {id:'s5',topic:'Senior',question:'How do retries explode cost?',answer30s:'Failed traffic × attempts amplifies load; ASG and DB cascade.',answer2m:'Timeouts, jittered backoff, max attempts, CB, bulkhead.',followUps:['Partial outage scenario?']},
  {id:'s6',topic:'Senior',question:'EC2 vs ECS vs EKS vs Lambda?',answer30s:'Match traffic shape, ops skill, cold starts, steady RPS economics.',answer2m:'Compare TCO not unit price.',followUps:['10k steady RPS payments?'],trick:'Lambda always cheapest.'},
  {id:'s7',topic:'Senior',question:'How does Kafka retention affect cost?',answer30s:'Storage ≈ data × RF × retention (+ overhead).',answer2m:'Archive cold to S3; size partitions for throughput not vanity.',followUps:['RF=3 meaning?']},
  {id:'s8',topic:'Senior',question:'Index cost vs benefit?',answer30s:'Faster SELECT, more storage and write amplification.',answer2m:'Too many indexes hurt ingest.',followUps:['When drop an index?']},
  {id:'s9',topic:'Senior',question:'Cost per API request?',answer30s:'Monthly infra / monthly requests; track trends and 2×/10×.',answer2m:'Also cost per business transaction.',followUps:['Attribution tags?']},
  {id:'s10',topic:'Senior',question:'Logging cost control?',answer30s:'Levels, sampling, retention tiers, no payload dumps, PII mask.',answer2m:'1M×10KB/day → hundreds of GB/month.',followUps:['Debug in prod?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Design cost-efficient 100k RPS global payments.',answer30s:'Edge cache/WAF, capacity model, fan-out budget, Multi-AZ, DR tier priced, cost/txn targets.',answer2m:'Regional affinity; avoid chatty cross-region.',followUps:['Active-active TCO?']},
  {id:'a2',topic:'Architect',question:'AWS bill +40% overnight — investigate.',answer30s:'Explorer→service→resource→metrics→deploy→code/amplification→fix→verify.',answer2m:'Don’t buy RI during unexplained spike.',followUps:['NAT vs compute?'],trick:'Immediately downsize everything.'},
  {id:'a3',topic:'Architect',question:'Cut 20% spend without hurting availability.',answer30s:'Rightsizing, logs, NAT endpoints, query fixes, non-prod schedules — keep Multi-AZ.',answer2m:'Prioritize Impact×Confidence/Effort backlog.',followUps:['Show ROI math.']},
  {id:'a4',topic:'Architect',question:'Cost vs availability vs security.',answer30s:'Invoice savings that raise outage/breach risk fail TCO.',answer2m:'Price downtime and compliance explicitly.',followUps:['Explain to CFO.']},
  {id:'a5',topic:'Architect',question:'Managed vs self-managed Kafka TCO.',answer30s:'AWS price + eng hours + on-call + upgrade risk.',answer2m:'Often managed wins at scale of ops burden.',followUps:['When self-manage?']},
  {id:'a6',topic:'Architect',question:'FinOps for 100+ microservices.',answer30s:'Tags, budgets, CUR, showback/chargeback, Kubecost/Infracost, cost-aware reviews.',answer2m:'Platform + finance + eng ownership.',followUps:['Prevent ₹5L accidental PR?']},
  {id:'a7',topic:'Architect',question:'Too many microservices cost impact.',answer30s:'More runtimes, network, observability, amplification.',answer2m:'Split by ownership/scale needs, not tables.',followUps:['Consolidation criteria?']},
  {id:'a8',topic:'Architect',question:'Prove optimization saved money.',answer30s:'Before/after Explorer + cost/txn + same traffic baseline; document ₹/year.',answer2m:'ROI and payback months.',followUps:['Confounders?']},
  {id:'a9',topic:'Architect',question:'DB costs grow every month — plan.',answer30s:'Retention/archive, partition, query, cache, right-size, backup policy.',answer2m:'Growth forecast into capacity model.',followUps:['Sharding when?']},
  {id:'a10',topic:'Architect',question:'Cost-aware CI/CD.',answer30s:'Infracost on TF PRs, load tests for amplification, budgets as gates, dashboards.',answer2m:'Block silent +₹3L infra diffs.',followUps:['Who owns veto?']},
];

export const RAPID_QS = [
  'What is TCO?',
  'Showback vs chargeback?',
  'When Spot?',
  'When Savings Plans?',
  'Graviton risks?',
  'Cost cascading failure?',
  'Cache stampede cost?',
  'Connection pool explosion?',
  'Cross-AZ transfer?',
  'S3 lifecycle?',
  'Pilot light vs warm standby cost?',
  'Kubecost finds what?',
  'Infracost in PR?',
  'CUR used how?',
  'Cost/txn formula?',
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See cheat / topic card — give payment-system example.',
  answer2m: 'State measure → fix → verify savings.',
  followUps: ['Trade-off?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
