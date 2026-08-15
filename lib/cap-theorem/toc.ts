import type {TocItem} from './types';

/** Interview kit TOC — theory encyclopedia stays off this list until toggled. */
export const CAP_TOC: TocItem[] = [
  {id: 'decide', label: '01. 30s decision'},
  {id: 'stories', label: '02. Draw these stories'},
  {id: 'spoken', label: '03. Say this out loud'},
  {id: 'picks', label: '04. Pick CP or AP'},
  {id: 'cheat', label: '05. One-page cheat'},
  {id: 'drill', label: '06. Quick drill'},
];

export const CAP_TOC_THEORY: TocItem[] = [
  {id: 'fundamentals', label: 'Theory · CAP letters'},
  {id: 'cp', label: 'Theory · CP systems'},
  {id: 'ap', label: 'Theory · AP systems'},
  {id: 'pacelc', label: 'Theory · PACELC'},
  {id: 'quorum', label: 'Theory · Quorum'},
  {id: 'kafka', label: 'Theory · Kafka knobs'},
  {id: 'cassandra', label: 'Theory · Cassandra'},
  {id: 'checklist', label: 'Theory · Checklist'},
];

export const MEMORY_SENTENCE =
  'Wire cut between replicas → Correct (CP) or keep Answering (AP). Money/seats = CP. Likes/feed = AP. One product = many slices. Healthy multi-region = PACELC (speed vs strong).';

export const VERSION_NOTE =
  'Architect interview kit — draw · decide · speak. Theory encyclopedia optional. Related: /microservice-communication · /distributed-locking · /kafka-interview.';
