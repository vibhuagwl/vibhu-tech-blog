import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'Partitioning vs sharding?',answer30s:'Partition splits a table inside one DB; sharding splits across DB instances.',answer2m:'Show failure domains and cross-unit TX difficulty.',followUps:['Can you combine both?']},
  {id:'s2',topic:'Senior',question:'What is partition pruning?',answer30s:'Planner skips partitions that cannot match the predicate.',answer2m:'EXPLAIN must show single partition for date equality.',followUps:['What defeats pruning?']},
  {id:'s3',topic:'Senior',question:'Range vs hash partition?',answer30s:'Range for time/ID ranges; hash for evenness.',answer2m:'Hot newest range vs remapping on hash modulus change.',followUps:['Composite?']},
  {id:'s4',topic:'Senior',question:'How choose a shard key?',answer30s:'High cardinality, even, matches query pattern, stable, avoids hotspots.',answer2m:'customer_id/tenant_id beats status/country.',followUps:['Bad keys?']},
  {id:'s5',topic:'Senior',question:'What is a hot shard?',answer30s:'Disproportionate traffic/storage on one shard due to key skew.',answer2m:'Salt, split, rehash, cache.',followUps:['Detection metrics?']},
  {id:'s6',topic:'Senior',question:'Consistent hashing why?',answer30s:'Add/remove nodes with minimal key movement vs hash%N.',answer2m:'Ring + vnodes.',followUps:['Caches vs DB shards?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Shard 10B banking transactions?',answer30s:'Hash/tenant by customer; range partitions by month per shard; single-shard APIs; saga for rare cross.',answer2m:'Global IDs; CDC reshard playbook; per-shard HA.',followUps:['Cross-shard statement?']},
  {id:'a2',topic:'Architect',question:'Cross-shard transactions?',answer30s:'Avoid; use saga/outbox; not naïve 2PC at scale.',answer2m:'Payment example with compensations.',followUps:['Idempotency?']},
  {id:'a3',topic:'Architect',question:'Reshard without downtime?',answer30s:'Copy→dual-write→validate→flip map→drain.',answer2m:'CDC; abort gates; rollback map.',followUps:['RPO during move?']},
  {id:'a4',topic:'Architect',question:'HA vs DR?',answer30s:'HA minimizes downtime (Multi-AZ); DR recovers from disaster (backup/PITR/region).',answer2m:'RPO/RTO sizing.',followUps:['Replica vs backup?'],trick:'Replica replaces backups.'},
  {id:'a5',topic:'Architect',question:'Primary fails then region fails?',answer30s:'Promote AZ replica first; if region gone promote cross-region; update router/DNS; validate RPO; Spring reconnect.',answer2m:'100-shard fan-out promote; game day.',followUps:['Failback?']},
  {id:'a6',topic:'Architect',question:'Accidental DELETE replicated everywhere?',answer30s:'Do not promote; PITR/immutable backup to pre-delete; validate; restore.',answer2m:'Ransomware same lesson.',followUps:['Backup validation?']},
  {id:'a7',topic:'Architect',question:'Spring after DB failover?',answer30s:'Endpoint flips; evict stale pool connections; bounded retry; idempotent payments.',answer2m:'Avoid retry storms.',followUps:['Hikari settings?']},
  {id:'a8',topic:'Architect',question:'Pagination across shards?',answer30s:'Scatter-gather merge/sort expensive; prefer single-shard keyset; cursor tokens with shard hints.',answer2m:'Avoid deep OFFSET globally.',followUps:['Global sort?']},
];

function rapid(): InterviewQ[] {
  const qs = [
    'Partition vs shard?','Pruning?','RANGE use?','LIST use?','HASH use?',
    'DROP vs DELETE?','MySQL LESS THAN?','Cassandra PK?','Mongo shard key?','Dynamo PK/SK?',
    'Range shard hotspot?','hash%N problem?','Consistent hash?','Directory shard?','Tenant shard?',
    'RoutingDataSource?','ThreadLocal leak?','Cross-shard SUM?','Saga why?','Reshard phases?',
    'Hot shard fix?','Snowflake ID?','RPO?','RTO?','Sync vs async?',
    'Replica ≠ backup?','Multi-AZ?','PITR?','Clone vs snapshot?','Shard promote?',
    'Corruption recovery?','Idempotency?','Retry storm?','Game day?','Failback?',
  ];
  return qs.map((q,i)=>({
    id:`r${i+1}`,topic:'Rapid',question:q,
    answer30s:'Mechanism → banking failure → SQL/Spring/AWS choice.',
    answer2m:'Tie to pruning/routing/RPO.',
    followUps:['What breaks at 10× data?'],
  }));
}

export const RAPID = rapid();
export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
