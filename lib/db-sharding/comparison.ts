export const PART_VS_SHARD = [
  {f:'DB instances',p:'Usually one',s:'Multiple'},
  {f:'Goal',p:'Manage large tables',s:'Horizontal DB scale'},
  {f:'App complexity',p:'Lower',s:'Higher'},
  {f:'Cross-unit TX',p:'Normal DB TX',s:'Hard'},
  {f:'Failure isolation',p:'Limited',s:'Better'},
];

export const DR_STRATEGIES = [
  {s:'Backup restore',rpo:'Higher',rto:'Higher',cost:'Low'},
  {s:'Snapshot',rpo:'Medium',rto:'Medium',cost:'Low/Med'},
  {s:'Read replica',rpo:'Low',rto:'Low/Med',cost:'Medium'},
  {s:'Multi-AZ',rpo:'Very low',rto:'Low',cost:'Medium'},
  {s:'Cross-region',rpo:'Low',rto:'Low/Med',cost:'High'},
  {s:'Active-active',rpo:'Very low',rto:'Very low',cost:'Very high'},
];

export const BACKUP_CLONE_REPLICA = [
  {f:'Historical recovery',b:'Yes',c:'Not primary',r:'Limited'},
  {f:'Live sync',b:'No',c:'Usually no',r:'Yes'},
  {f:'Failover',b:'No',c:'Usually no',r:'Yes'},
  {f:'Test envs',b:'Yes',c:'Excellent',r:'Possible'},
];

export const CHEAT: [string, string][] = [
  ['Partitioning', 'Split table in one DB'],
  ['Sharding', 'Split across DB instances'],
  ['RANGE', 'Time / sequential'],
  ['LIST', 'Region / category'],
  ['HASH', 'Even distribution'],
  ['Pruning', 'Skip useless partitions'],
  ['Consistent hash', 'Minimal remap'],
  ['Tenant shard', 'SaaS isolation'],
  ['Hot shard', 'Bad / skewed key'],
  ['RPO', 'Data you can lose'],
  ['RTO', 'Time to recover'],
  ['Replica ≠ backup', 'DELETE replicates'],
  ['PITR', 'Backup + logs rewind'],
  ['Idempotency', 'Safe payment retry'],
];

export const REMEMBER: [string, string][] = [
  ['Partition', 'Drawers in one cabinet'],
  ['Shard', 'Different offices'],
  ['HA', 'Stay up'],
  ['DR', 'Recover after disaster'],
  ['Promote', 'Only if replica is clean'],
  ['Shard+Part', 'Often combined'],
];

export const DECISION = [
  {q:'One DB can hold data/QPS?',yes:'Partition (+ indexes/cache)',no:'Shard'},
  {q:'Access by time?',yes:'RANGE partitions',no:'Continue'},
  {q:'Need even writes?',yes:'HASH / consistent hash',no:'Range/list OK'},
  {q:'SaaS isolation?',yes:'Tenant directory sharding',no:'Customer hash'},
  {q:'RPO near zero / AZ loss?',yes:'Multi-AZ sync/semi-sync',no:'Async OK'},
  {q:'Region disaster?',yes:'Cross-region DR + runbooks',no:'Multi-AZ may suffice'},
  {q:'Logical DELETE/corruption?',yes:'PITR / immutable backup',no:'Do not only promote'},
];
