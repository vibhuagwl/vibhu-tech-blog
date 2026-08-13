import type {MatrixRow} from './types';

export const MATRIX: MatrixRow[] = [
  {name:'JVM synchronized',impl:'Monitor',best:'Single JVM',risk:'Not cross-instance'},
  {name:'ReentrantLock',impl:'Java Lock API',best:'Single JVM advanced',risk:'Not cross-instance'},
  {name:'DB FOR UPDATE',impl:'Pessimistic row',best:'Row is the critical section',risk:'DB contention / long TX'},
  {name:'DB lock table',impl:'Unique row',best:'Simple named locks',risk:'Stale locks / hotspot'},
  {name:'Redis SET NX PX',impl:'Token + TTL',best:'Fast short mutex',risk:'Lease/dual-owner complexity'},
  {name:'Redisson RLock',impl:'Redis recipe',best:'Production Redis locking',risk:'Redis dependency'},
  {name:'ZooKeeper/Curator',impl:'Ephemeral seq',best:'Coordination / election',risk:'Ops complexity'},
  {name:'Hazelcast',impl:'ILock / FencedLock',best:'Already on HZ',risk:'Cluster dependency'},
  {name:'Infinispan',impl:'Clustered lock',best:'Already on ISPN',risk:'Ops complexity'},
  {name:'File lock',impl:'OS/FS',best:'Legacy special case',risk:'Cloud FS semantics'},
];

export const CHEAT: [string, string][] = [
  ['JVM lock', 'One process only'],
  ['FOR UPDATE', 'Lock the ledger row'],
  ['Lock table', 'Unique name reservation'],
  ['SET NX PX', 'Create-only + TTL'],
  ['Safe unlock', 'Token + Lua'],
  ['Redisson', 'tryLock + watchdog'],
  ['ZooKeeper', 'Ticket / ephemeral'],
  ['Fencing', 'Monotonic token on write'],
  ['Lease too short', 'Dual owners'],
  ['Deadlock', 'Sort lock order'],
  ['Optimistic', 'Detect conflict'],
  ['Saga', 'Not a mutex'],
  ['Prefer SQL', 'Constraint / atomic UPDATE'],
  ['Fail-closed', 'Money path if lock store down'],
];

export const REMEMBER: [string, string][] = [
  ['synchronized', 'Won\'t cross pods'],
  ['Distributed lock', 'One owner across instances'],
  ['Token', 'Proves ownership'],
  ['TTL', 'Crash recovery'],
  ['Fence', 'Reject stale writers'],
  ['Order', 'Avoid deadlock'],
  ['Short CS', 'Keep holds tiny'],
  ['DB first', 'Invariant in SQL when possible'],
];

export const DECISION = [
  {q:'Single JVM?',yes:'synchronized / ReentrantLock',no:'Continue'},
  {q:'Critical section is DB row?',yes:'SELECT FOR UPDATE / atomic SQL',no:'Continue'},
  {q:'Need named coordination only?',yes:'Lock table or Redis',no:'Continue'},
  {q:'Redis already in stack?',yes:'Redis / Redisson',no:'Evaluate ZK/Hazelcast/DB'},
  {q:'Conflicts rare & retry OK?',yes:'@Version optimistic',no:'Distributed lock'},
  {q:'Multi-service business TX?',yes:'Saga + idempotency (not one giant lock)',no:'Local short locks'},
];
