import type {TocItem} from './types';

/** Unique mastery drills only — producer/consumer/cluster/optimization/properties live on dedicated routes. */
export const KAFKA_MASTERY_TOC: TocItem[] = [
  {id: 'curriculum', label: '00. Interview map'},
  {id: 'monitoring', label: '01. Monitoring in prod'},
  {id: 'instances', label: '02. Instance counts'},
  {id: 'syncing', label: '03. How syncing works'},
  {id: 'partitions', label: '04. How many partitions'},
  {id: 'interview', label: '05. Spoken answers'},
];
