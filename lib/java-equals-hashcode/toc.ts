import type {TocItem} from './types';

export const EQHC_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview'},
  {id: 'contract', label: '01. equals / hashCode contract'},
  {id: 'buckets', label: '02. HashMap buckets & Entry'},
  {id: 'combos', label: '03. All equals × hashCode combos'},
  {id: 'hashmap', label: '04. HashMap results'},
  {id: 'linked', label: '05. LinkedHashMap'},
  {id: 'chm', label: '06. ConcurrentHashMap'},
  {id: 'treemap', label: '07. TreeMap (compareTo)'},
  {id: 'matrix', label: '08. Cross-map matrix'},
  {id: 'prefer', label: '09. Preferred key types'},
  {id: 'pitfalls', label: '10. Pitfalls & anti-patterns'},
  {id: 'demo', label: '11. Runnable demo'},
  {id: 'interview', label: '12. Interview drills'},
];
