import type {MatrixRow} from './types';

export const MATRIX: MatrixRow[] = [
  {name:'Caffeine',distributed:'No (JVM)',persistence:'No',replication:'No',spring:'Excellent',best:'L1 ultra-low latency',drawback:'Per-instance; hard multi-pod invalidate'},
  {name:'Redis',distributed:'Yes',persistence:'Optional RDB/AOF',replication:'Replica/Cluster',spring:'Excellent',best:'Shared cache/locks/sessions',drawback:'Network hop; ops complexity'},
  {name:'Hazelcast',distributed:'Yes (IMDG)',persistence:'MapStore optional',replication:'Partition backups',spring:'Good',best:'Compute+data grid',drawback:'Heavier footprint'},
  {name:'Infinispan',distributed:'Yes',persistence:'Stores',replication:'Owners',spring:'Good',best:'JBoss/Red Hat ecosystems',drawback:'Learning curve'},
  {name:'Ehcache',distributed:'Tiered / clustered editions',persistence:'Disk tiers',replication:'Varies',spring:'Good',best:'Local/tiered classic',drawback:'Distributed story product-dependent'},
  {name:'Memcached',distributed:'Client sharding',persistence:'No',replication:'No (classic)',spring:'Via apps',best:'Simple volatile KV',drawback:'Fewer structures; weaker HA story'},
];

export const DECISION = [
  {q:'Shared across JVMs?',no:'Caffeine / local Ehcache',yes:'Redis / grid'},
  {q:'Ultra-low latency hot path?',no:'Redis alone OK',yes:'L1 Caffeine + L2 Redis'},
  {q:'Strong consistency needed?',no:'Cache + eventual invalidate',yes:'Read DB / row locks / avoid cache for that field'},
  {q:'Write-heavy rarely re-read?',no:'Cache-aside',yes:'Write-around + evict'},
  {q:'Payment ledger balances?',no:'—',yes:'DB is source of truth; cache carefully / short TTL / invalidate'},
  {q:'Multi-tenant SaaS?',no:'Simple keys',yes:'tenant: prefixes + quotas'},
  {q:'50 services share entity?',no:'Redis pub/sub',yes:'Kafka/CDC invalidation'},
];

export const CHEAT: [string, string][] = [
  ['Cache-aside', 'App controls get/put'],
  ['Write-through', 'Cache + DB sync path'],
  ['Write-behind', 'Cache first, DB async (durability risk)'],
  ['Write-around', 'Write DB, skip cache'],
  ['Refresh-ahead', 'Reload before TTL death'],
  ['L1', 'JVM-local (Caffeine)'],
  ['L2', 'Distributed (Redis)'],
  ['TTL', 'Time to live'],
  ['LRU / LFU', 'Recency / frequency eviction'],
  ['Stampede', 'Many loaders on one miss'],
  ['Penetration', 'Invalid keys bypass cache'],
  ['Avalanche', 'Mass synchronized expiry'],
  ['Hot key', 'One key eats a node'],
  ['Hash tag {x}', 'Pin related keys to one slot'],
  ['Fail-open', 'Redis down → still serve DB'],
];

export const REMEMBER: [string, string][] = [
  ['Cache', 'Acceleration, usually not SoR'],
  ['Invalidate', 'Safer than put after writes'],
  ['Jitter', 'Breaks expiry cliffs'],
  ['Lock NX PX', 'Stampede / single-flight'],
  ['afterCommit', 'TX then cache'],
  ['JSON ser', 'Not JDK serialization'],
  ['L1+L2', 'Latency + shared truth'],
  ['Kafka bust', 'Multi-service coherence'],
];

export const THIRTY_MIN = [
  {id:'taxonomy',title:'Local vs Distributed',facts:['JVM vs network','invalidate hardness','when L1+L2'],trap:'Only Redis for everything',q:'When is Caffeine enough?'},
  {id:'spring-cache',title:'Spring Cache',facts:['AOP proxy','@Cacheable miss path','self-invocation'],trap:'this.get() cached',q:'Why proxy matters?'},
  {id:'redis-cluster',title:'Cluster slots',facts:['16384','CRC16','hash tags'],trap:'Cross-slot MULTI',q:'Why {customer}?'},
  {id:'stampede',title:'Stampede',facts:['NX lock','losers wait','jitter'],trap:'No TTL on lock',q:'Token unlock why?'},
  {id:'kafka-invalidate',title:'Invalidation bus',facts:['afterCommit','idempotent','lag = staleness'],trap:'Cache update in TX',q:'Pub/sub vs Kafka?'},
  {id:'failures',title:'Fail-open',facts:['timeouts','CB','DB shed'],trap:'Block forever on Redis',q:'Redis p99 100ms — what?'},
];
