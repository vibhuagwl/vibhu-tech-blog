import type {TocItem} from './types';

export const SA_TOC: TocItem[] = [
  {id: 'overview', label: '00. Start here'},
  {id: 'stories', label: '01. Mental model stories'},
  {id: 'startup', label: '02. Startup pipeline'},
  {id: 'stereotype', label: '03. @Component family'},
  {id: 'config', label: '04. @Configuration · @Bean · @Import'},
  {id: 'di', label: '05. DI · @Autowired · Qualifier'},
  {id: 'boot', label: '06. Boot · auto-config · conditions'},
  {id: 'lifecycle', label: '07. Lifecycle · scope · @Lazy'},
  {id: 'aop-tx', label: '08. AOP · @Transactional'},
  {id: 'async-cache', label: '09. @Async · @Cache · events'},
  {id: 'web', label: '10. MVC · validation · advice'},
  {id: 'kafka-data-sec', label: '11. Kafka · Data · Security'},
  {id: 'proxy', label: '12. Proxy · ordering · matrix'},
  {id: 'payment-trace', label: '13. Payment end-to-end'},
  {id: 'who-processes', label: '14. Who processes?'},
  {id: 'scenarios', label: '15. Debug scenarios'},
  {id: 'spoken', label: '16. Spoken answers'},
  {id: 'interview', label: '17. Interview mode'},
  {id: 'cheatsheet', label: '18. Cheat sheet'},
  {id: 'checklist', label: '19. Coverage checklist'},
];

export const MEMORY_SENTENCE =
  'SCAN → REGISTER → INJECT → POST-PROCESS → PROXY → EXECUTE. Annotations either build BeanDefinitions early or intercept method calls via proxies later. Self-invocation skips the proxy.';

export const VERSION_NOTE =
  'Spring Framework 6 / Boot 3 / Jakarta EE focus (javax called out only for Boot 2 legacy). Related: /spring-security · /oauth-jwt-demo · /kafka-interview · /distributed-caching.';
