import type {TocItem} from './types';

export const CAP_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'stories', label: '01. Story theater + whiteboard'},
  {id: 'spoken', label: '02. Spoken 60s / 2m / Staff'},
  {id: 'design-qs', label: '03. Design scenarios'},
  {id: 'predict', label: '04. Predict behavior'},
  {id: 'interview', label: '05. Interview mode'},
  {id: 'reference-hint', label: '06. Deep theory (toggle)'},
  {id: 'fundamentals', label: 'Ref · CAP fundamentals'},
  {id: 'consistency', label: 'Ref · Consistency'},
  {id: 'availability', label: 'Ref · Availability'},
  {id: 'partition', label: 'Ref · Partition'},
  {id: 'tradeoff', label: 'Ref · C vs A'},
  {id: 'pick-two', label: 'Ref · Not pick-two'},
  {id: 'cp', label: 'Ref · CP'},
  {id: 'ap', label: 'Ref · AP'},
  {id: 'pacelc', label: 'Ref · PACELC'},
  {id: 'quorum', label: 'Ref · Quorum'},
  {id: 'kafka', label: 'Ref · Kafka'},
  {id: 'cassandra', label: 'Ref · Cassandra'},
  {id: 'saga', label: 'Ref · Saga'},
  {id: 'cheatsheet', label: 'Ref · Cheat sheet'},
  {id: 'checklist', label: 'Ref · Checklist'},
];

export const MEMORY_SENTENCE =
  'Cut phone between replicas → Correct (CP) or Answer (AP). Money/seats = CP. Likes/feed = AP. One product = many CAP slices. PACELC = accident + daily commute.';

export const VERSION_NOTE =
  'Story-first CAP interview board. Related: /distributed-locking · /kafka-interview · /microservices-patterns · /system-design.';
