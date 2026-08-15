import type {TocItem} from './types';

export const SA_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'inventory', label: '01. Master inventory'},
  {id: 'ownership', label: '02. Ownership matrix'},
  {id: 'coverage-audit', label: '03. Coverage audit'},
  {id: 'version-matrix', label: '04. Version / deprecation'},
  {id: 'stories', label: '05. Mental model stories'},
  {id: 'startup', label: '06. Startup pipeline'},
  {id: 'stereotype', label: '07. @Component family'},
  {id: 'config', label: '08. @Configuration · @Bean'},
  {id: 'di', label: '09. DI'},
  {id: 'gaps-core', label: '10. AliasFor · Order · conditions'},
  {id: 'boot', label: '11. Boot · auto-config'},
  {id: 'lifecycle', label: '12. Lifecycle · scope'},
  {id: 'aop-tx', label: '13. AOP · @Transactional'},
  {id: 'async-cache', label: '14. Async · Cache · events'},
  {id: 'web', label: '15. MVC · validation'},
  {id: 'gaps-web-test', label: '16. WebFlux · Test'},
  {id: 'kafka-data-sec', label: '17. Kafka · Data · Security'},
  {id: 'gaps-data-sec', label: '18. Auditing · DLT · Actuator'},
  {id: 'ecosystem', label: '19. Cloud · Batch · Integration'},
  {id: 'proxy', label: '20. Proxy matrix'},
  {id: 'payment-trace', label: '21. Payment E2E'},
  {id: 'who-processes', label: '22. Who processes?'},
  {id: 'scenarios', label: '23. Debug scenarios'},
  {id: 'spoken', label: '24. Spoken answers'},
  {id: 'interview', label: '25. Interview mode'},
  {id: 'cheatsheet', label: '26. Cheat sheet'},
  {id: 'checklist', label: '27. Zero-missed checklist'},
];

export const MEMORY_SENTENCE =
  'Inventory first → ownership (Spring vs Jakarta vs Kafka) → processor → proxy? → lifecycle. Self-invocation skips proxy. Boot 3 / SF 6 baseline; legacy Stream bindings marked deprecated.';

export const VERSION_NOTE =
  'Spring Framework 6 / Boot 3 / Jakarta. Inventory spans Core→Cloud→Batch→Integration→Session→Test. Related: /spring-security · /kafka-interview · /distributed-caching.';
