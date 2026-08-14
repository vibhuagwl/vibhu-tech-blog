import type {TocItem} from './types';

export const KAFKA_INTERNALS_TOC: TocItem[] = [
  {id: 'overview', label: '01. How Kafka works'},
  {id: 'anatomy', label: '02. Cluster anatomy'},
  {id: 'write-path', label: '03. Write into a partition'},
  {id: 'replication', label: '04. Replication between brokers'},
  {id: 'production', label: '05. Production deploy & instance count'},
  {id: 'consumer-fail', label: '06. Consumer dies — same message?'},
  {id: 'walkthrough', label: '07. Internals walkthrough'},
  {id: 'interview', label: '08. Interview board'},
  {id: 'cheat', label: '09. Memory formulas'},
];
