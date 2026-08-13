import type {InterviewQ} from './types';

export const BASIC: InterviewQ[] = [
  {id:'b1',topic:'Basic',question:'What is distributed locking?',answer30s:'Coordination so only one instance across many JVMs owns a critical section at a time.',answer2m:'Needed because synchronized is per-JVM. Implement with DB, Redis, ZK, etc., with lease and ownership.',followUps:['Give a banking example.']},
  {id:'b2',topic:'Basic',question:'Why doesn’t synchronized work across servers?',answer30s:'Each Spring Boot pod has its own JVM monitor — locks are not shared.',answer2m:'Show load balancer → 3 apps → separate heaps.',followUps:['What about sticky sessions?'],trick:'Sticky sessions fix mutual exclusion for all APIs.'},
  {id:'b3',topic:'Basic',question:'What is SET NX?',answer30s:'Set key only if it does not exist — create-only acquire.',answer2m:'Combined with PX for TTL lease.',followUps:['What does PX do?']},
  {id:'b4',topic:'Basic',question:'What is TTL on a lock?',answer30s:'Automatic expiry so a crashed holder cannot block forever.',answer2m:'Too short → dual owners; too long → slow recovery.',followUps:['How size TTL?']},
  {id:'b5',topic:'Basic',question:'lock() vs tryLock()?',answer30s:'lock waits; tryLock returns immediately; timed tryLock caps wait.',answer2m:'Prefer timed on request threads.',followUps:['What HTTP code on fail?']},
];

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'Why a unique lock token?',answer30s:'Identifies owner so unlock cannot delete someone else’s lock after expiry.',answer2m:'Pair with Lua compare-and-del.',followUps:['Show the race with plain DEL.'],trick:'Any delete is fine.'},
  {id:'s2',topic:'Senior',question:'Why is Redis DEL unsafe alone?',answer30s:'After your lease expires another owner may hold the key; DEL steals it.',answer2m:'Diagram App-1 pause → App-2 acquire → App-1 DEL.',followUps:['Write the Lua.']},
  {id:'s3',topic:'Senior',question:'Redis lock vs DB FOR UPDATE?',answer30s:'FOR UPDATE if the row is the critical section; Redis for fast/app-level coordination.',answer2m:'DB contention vs Redis failure domain; don’t double-lock blindly.',followUps:['When both?'],trick:'Redis is always better.'},
  {id:'s4',topic:'Senior',question:'What if Redis is unavailable?',answer30s:'For money paths usually fail-closed; don’t debit without coordination.',answer2m:'Timeouts, CB, metrics, degrade only if invariant still enforced in DB.',followUps:['Fail-open ever OK?']},
  {id:'s5',topic:'Senior',question:'How prevent deadlocks?',answer30s:'Deterministic lock order, timeouts, fewer locks, short sections.',answer2m:'Sort account ids for transfers.',followUps:['Detection in prod?']},
  {id:'s6',topic:'Senior',question:'Redisson vs manual SET NX?',answer30s:'Redisson adds wait/lease/watchdog APIs; manual needs careful Lua/renewal.',answer2m:'Still understand failure modes.',followUps:['Watchdog limits?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'What happens in a network partition?',answer30s:'Clients may disagree on lock ownership; Redis locking is not automatic consensus safety.',answer2m:'Discuss fencing, fail-closed, and ZK/CP systems.',followUps:['CAP for lock stores?'],trick:'Redis Cluster makes locks perfectly safe always.'},
  {id:'a2',topic:'Architect',question:'What is a fencing token?',answer30s:'Monotonic token per grant; storage rejects stale tokens from expired holders.',answer2m:'Client A=101 pauses; B=102 writes; A’s 101 rejected.',followUps:['Where store fence?']},
  {id:'a3',topic:'Architect',question:'JVM pauses 30s while holding a 10s lease?',answer30s:'Lease may expire; another owner starts; paused owner must not write without fence.',answer2m:'STW/GC is a real production hazard.',followUps:['Watchdog enough?']},
  {id:'a4',topic:'Architect',question:'Design locks multi-region?',answer30s:'Avoid cross-region synchronous locks on critical path; regional SoR + async; or global CP store with high RTT cost.',answer2m:'Prefer partition by account region.',followUps:['Hot global account?']},
  {id:'a5',topic:'Architect',question:'1M concurrent lock requests?',answer30s:'Hot key/lock becomes bottleneck; shard resources, queue per account, atomic SQL, avoid one global lock.',answer2m:'Backpressure and admission control.',followUps:['How observe hot locks?']},
  {id:'a6',topic:'Architect',question:'When avoid distributed locking completely?',answer30s:'When unique constraints, atomic updates, idempotency keys, queues, or optimistic locking suffice.',answer2m:'Locks amplify outages when misused.',followUps:['Example overengineering?']},
  {id:'a7',topic:'Architect',question:'Can Redis locking alone guarantee correctness?',answer30s:'No — leases, pauses, partitions require careful design; often pair with DB invariants/fencing.',answer2m:'Be honest in interviews about Redlock debates.',followUps:['Martin Kleppmann critique?']},
  {id:'a8',topic:'Architect',question:'Migrate DB locks → Redis safely?',answer30s:'Dual-run metrics; feature flag; keep DB invariant; shadow compare; gradual traffic.',answer2m:'Never remove FOR UPDATE until Redis path proven under failure tests.',followUps:['Rollback plan?']},
];

function rapid(): InterviewQ[] {
  const qs = [
    'SET NX meaning?','PX meaning?','Why token?','Lua unlock why?','Lease too short?',
    'Watchdog purpose?','Fencing purpose?','FOR UPDATE releases when?','Lock table UK?',
    'tryLock timeout on HTTP?','Deadlock fix?','Optimistic vs lock?','Saga vs lock?',
    'Fail-closed when?','Redis down policy?','Ephemeral node?','Curator recipe?',
    'Hazelcast FencedLock?','File lock in K8s?','Hold metrics?','Hot account lock?',
    'Sort lock order?','Commit then unlock?','Atomic SQL debit?','Idempotency key?',
    'Redlock debate?','Partition risk?','GC pause risk?','Multi-region lock?',
    'When NOT to lock?',
  ];
  return qs.map((q,i)=>({
    id:`r${i+1}`,topic:'Rapid',question:q,
    answer30s:'Mechanism → failure → production choice with Account A100 debit.',
    answer2m:'Tie to lease, token, fencing, and DB invariant.',
    followUps:['What breaks at 10× contention?'],
  }));
}

export const RAPID = rapid();
export const ALL = [...BASIC, ...SENIOR, ...ARCHITECT, ...RAPID];
