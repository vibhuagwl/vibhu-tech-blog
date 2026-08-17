import type {TocItem} from './types';

/** Story-driven CAP tutorial TOC — matches hub section ids. */
export const CAP_TOC: TocItem[] = [
  {id: 'cap30', label: '01. CAP in 30s'},
  {id: 'story', label: '02. Payment story'},
  {id: 'replicas', label: '03. Two replicas'},
  {id: 'partition', label: '04. Partition happens'},
  {id: 'cp', label: '05. Decision CP'},
  {id: 'ap', label: '06. Decision AP'},
  {id: 'meanings', label: '07. C / A / P'},
  {id: 'pick-two', label: '08. Pick-any-two myth'},
  {id: 'spring', label: '09. Spring Boot code'},
  {id: 'simulator', label: '10. Partition simulator'},
  {id: 'double-spend', label: '11. Double-spend'},
  {id: 'ecommerce', label: '12. Inventory AP'},
  {id: 'databases', label: '13. Database examples'},
  {id: 'acid', label: '14. CAP vs ACID'},
  {id: 'eventual', label: '15. Eventual consistency'},
  {id: 'quorum', label: '16. Quorum'},
  {id: 'microservices', label: '17. Microservices'},
  {id: 'pacelc', label: '18. PACELC'},
  {id: 'spoken', label: '19. 2-min interview'},
  {id: 'questions', label: '20. Interview questions'},
  {id: 'traps', label: '21. Interview traps'},
  {id: 'memory', label: '22. Memory diagram'},
  {id: 'theory-extra', label: '23. Theory (optional)'},
];

/** @deprecated kept for any imports; theory is optional inside the hub */
export const CAP_TOC_THEORY: TocItem[] = [];

export {MEMORY_SENTENCE, VERSION_NOTE} from './tutorial';
