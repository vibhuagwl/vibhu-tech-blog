import type {TocItem} from './types';

export const SA_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'inventory', label: '01. Master inventory'},
  {id: 'stories', label: '02. Mental model stories'},
  {id: 'startup', label: '03. Startup pipeline'},
  {id: 'stereotype', label: '04. @Component family'},
  {id: 'config', label: '05. @Configuration · @Bean · @Import'},
  {id: 'di', label: '06. DI · @Autowired · Qualifier'},
  {id: 'gaps-core', label: '07. Gaps · AliasFor · Order · conditions'},
  {id: 'boot', label: '08. Boot · auto-config'},
  {id: 'lifecycle', label: '09. Lifecycle · scope · @Lazy'},
  {id: 'aop-tx', label: '10. AOP · @Transactional'},
  {id: 'async-cache', label: '11. @Async · @Cache · events'},
  {id: 'web', label: '12. MVC · validation'},
  {id: 'gaps-web-test', label: '13. WebFlux · Test slices'},
  {id: 'kafka-data-sec', label: '14. Kafka · Data · Security'},
  {id: 'gaps-data-sec', label: '15. Auditing · DLT · Actuator'},
  {id: 'proxy', label: '16. Proxy · ordering · matrix'},
  {id: 'payment-trace', label: '17. Payment end-to-end'},
  {id: 'who-processes', label: '18. Who processes?'},
  {id: 'scenarios', label: '19. Debug scenarios'},
  {id: 'spoken', label: '20. Spoken answers'},
  {id: 'interview', label: '21. Interview mode'},
  {id: 'cheatsheet', label: '22. Cheat sheet'},
  {id: 'checklist', label: '23. Coverage checklist'},
];

export const MEMORY_SENTENCE =
  'SCAN → REGISTER → INJECT → POST-PROCESS → PROXY → EXECUTE. Inventory first — then processors. Self-invocation skips the proxy. Enterprise coverage ≠ every Spring Cloud annotation ever shipped.';

export const VERSION_NOTE =
  'Spring Framework 6 / Boot 3 / Jakarta. Inventory + deep cards for Core, Boot, MVC, WebFlux, Security, Data, Kafka, Test, Actuator. Related: /spring-security · /kafka-interview · /distributed-caching.';
