import type {TocItem} from './types';

export const BLOOM_TOC: TocItem[] = [
  {id: 'overview', label: 'What is a Bloom Filter?'},
  {id: 'architecture', label: 'Internal Working'},
  {id: 'code-sequences', label: 'Code Sequences'},
  {id: 'math', label: 'Math & Memory'},
  {id: 'java-impl', label: 'Java From Scratch'},
  {id: 'hashing', label: 'Double Hashing'},
  {id: 'concurrency', label: 'Thread Safety'},
  {id: 'spring', label: 'Spring Boot'},
  {id: 'cache-penetration', label: 'Cache Penetration'},
  {id: 'storage-engines', label: 'DB / LSM / Cassandra'},
  {id: 'kafka', label: 'Kafka Idempotency'},
  {id: 'comparisons', label: 'vs HashSet / Cuckoo / Redis'},
  {id: 'deletion', label: 'Deletion & Counting BF'},
  {id: 'distributed', label: 'Multi-Instance'},
  {id: 'failures', label: 'Failure Scenarios'},
  {id: 'mistakes', label: 'Production Mistakes'},
  {id: 'interview', label: 'Interview Qs'},
  {id: 'storytelling', label: '2-Minute Answer'},
  {id: 'lab', label: 'Runnable Lab'},
  {id: 'checklist', label: 'Cheat Sheet'},
];
