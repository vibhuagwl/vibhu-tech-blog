import type {TocItem} from './types';

/** Default interview kit — no encyclopedia dump. */
export const SA_TOC: TocItem[] = [
  {id: 'decide', label: '01. 30s mental model'},
  {id: 'stories', label: '02. Draw these stories'},
  {id: 'spoken', label: '03. Say this out loud'},
  {id: 'picks', label: '04. Debug picks'},
  {id: 'cheat', label: '05. One-page cheat'},
  {id: 'drill', label: '06. Memory strip'},
];

export const SA_TOC_THEORY: TocItem[] = [
  {id: 'proxy', label: 'Theory · Proxy matrix'},
  {id: 'inventory', label: 'Theory · Inventory search'},
  {id: 'stereotype', label: 'Theory · Stereotypes'},
  {id: 'aop-tx', label: 'Theory · @Transactional'},
  {id: 'boot', label: 'Theory · Boot auto-config'},
  {id: 'web', label: 'Theory · Web'},
  {id: 'checklist', label: 'Theory · Checklist'},
];

export const MEMORY_SENTENCE =
  'SCAN → REGISTER → INJECT → PROXY → EXECUTE. External call hits proxy. this.method skips proxy → no @Transactional / @Async / @Cacheable. Boot 3 / Jakarta.';

export const VERSION_NOTE =
  'Architect interview kit — draw the pipeline, not memorize 200 annotations. Encyclopedia optional. Related: /spring-security · /kafka-interview · /microservice-communication.';
