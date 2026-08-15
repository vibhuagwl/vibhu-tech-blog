import type {TocItem} from './types';

/** Interview kit path — sidebar filter only; full page always mounts. */
export const SA_KIT_TOC_IDS = new Set([
  'decide',
  'pipeline',
  'stories',
  'spoken',
  'picks',
  'cheat',
  'wrong-vs-correct',
  'incidents',
  'interview',
  'drill',
]);

export const SA_TOC: TocItem[] = [
  {id: 'decide', label: '01. Mental model'},
  {id: 'pipeline', label: '02. Annotation → runtime pipeline'},
  {id: 'hierarchy', label: '03. Ownership hierarchy'},
  {id: 'stories', label: '04. Draw these stories'},
  {id: 'spoken', label: '05. Say this out loud'},
  {id: 'startup', label: '06. Startup & BeanDefinition'},
  {id: 'boot-run', label: '07. SpringApplication.run'},
  {id: 'autoconfig', label: '08. Auto-configuration'},
  {id: 'stereotype', label: '09. Stereotypes'},
  {id: 'di', label: '10. Dependency injection'},
  {id: 'config-beans', label: '11. @Configuration / @Bean'},
  {id: 'lifecycle', label: '12. Lifecycle'},
  {id: 'aop-tx', label: '13. @Transactional / AOP'},
  {id: 'async-cache', label: '14. @Async / cache / events'},
  {id: 'web', label: '15. Web / MVC'},
  {id: 'kafka-data', label: '16. Kafka / Data / Security'},
  {id: 'proxy', label: '17. Proxy matrix'},
  {id: 'processors', label: '18. Processor map'},
  {id: 'gaps', label: '19. Gaps · test · actuator'},
  {id: 'ecosystem', label: '20. Ecosystem ownership'},
  {id: 'wrong-vs-correct', label: '21. Wrong vs correct'},
  {id: 'incidents', label: '22. Production incidents'},
  {id: 'decisions', label: '23. Decision guide'},
  {id: 'inventory', label: '24. Inventory search'},
  {id: 'picks', label: '25. Debug picks'},
  {id: 'cheat', label: '26. Cheat sheets'},
  {id: 'interview', label: '27. Interview simulator'},
  {id: 'drill', label: '28. Memory strip'},
  {id: 'related', label: '29. Related hubs'},
];

/** @deprecated kept for imports — use SA_TOC + SA_KIT_TOC_IDS */
export const SA_TOC_THEORY: TocItem[] = SA_TOC.filter((i) => !SA_KIT_TOC_IDS.has(i.id));

export const MEMORY_SENTENCE =
  'Annotation = metadata. Scanner/CCPP/ImportSelector → BeanDefinition → BPP → maybe proxy → runtime. External call hits proxy; this.method() skips advice. Label ownership: Framework ≠ Boot ≠ Data ≠ Security ≠ Kafka ≠ Resilience4j.';

export const VERSION_NOTE =
  'Spring Framework 6.x / Spring Boot 3.x baseline (Jakarta). Version-dependent notes called out on cards. Staff/Principal depth: processor names + proxy boundaries, not cheat-sheet definitions.';
