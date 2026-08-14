import type {TocItem} from './types';

export const KAFKA_PROPERTIES_TOC: TocItem[] = [
  {id: 'must-set', label: '00. Must-set (payments)'},
  {id: 'interact', label: '01. How they interact'},
  {id: 'producer', label: '02. Producer catalog'},
  {id: 'consumer', label: '03. Consumer catalog'},
  {id: 'controller', label: '04. Controller / KRaft'},
  {id: 'broker', label: '05. Broker & cluster'},
  {id: 'topic', label: '06. Topic-level'},
  {id: 'spring', label: '07. Spring mapping'},
  {id: 'go-nogo', label: '08. GO / NO-GO'},
];
