/** Part 1 categories + Part 2 full startup pipeline — who processes which annotations. */

export type StartupSection = {
  id: string;
  title: string;
  body: string;
  flow: string;
  remember: string[];
  trap: string;
  answer60s: string;
};

export const STARTUP_SECTIONS: StartupSection[] = [
  {
    id: 'bean-definition',
    title: 'BeanDefinition — the recipe, not the dish',
    body:
      'A BeanDefinition describes how to build a bean: class name, scope, lazy, autowire mode, constructor args, property values, factory method metadata, and init/destroy method names. Component scanning, @Bean methods, XML, and auto-configuration all register BeanDefinitions into a BeanDefinitionRegistry before any live object exists. The definition is the contract the container will honor at instantiation time.',
    flow: `flowchart TD
  Sources[@Component scan · @Bean · XML · Auto-config] --> BD[BeanDefinition]
  BD --> Meta[class · scope · lazy · ctor · @Bean factoryMethod]
  Meta --> Reg[(BeanDefinitionRegistry)]
  Reg --> Later[refresh → instantiate]`,
    remember: [
      'BeanDefinition = recipe; bean instance = cooked object.',
      'Scan and @Configuration register definitions first.',
      'Bean name defaults: camelCase simple class name.',
      'Primary/lazy/scope live on the definition.',
    ],
    trap: 'Saying @Component creates the singleton at scan time — only the definition is registered.',
    answer60s:
      'BeanDefinition is Spring metadata for how to construct a bean. Scanning and @Bean methods populate the registry with definitions; actual objects are created later during context refresh when the factory resolves dependencies.',
  },
  {
    id: 'bean-factory',
    title: 'BeanFactory — core container API',
    body:
      'BeanFactory is the minimal container contract: getBean, containsBean, isSingleton, getType, aliases. DefaultListableBeanFactory is the workhorse implementation combining definition registry and singleton cache. ApplicationContext extends ListableBeanFactory and adds event publication, resource loading, and internationalization. Boot’s ApplicationContext is a refreshed DefaultListableBeanFactory plus environment and post-processors.',
    flow: `flowchart LR
  BF[BeanFactory API] --> DLBF[DefaultListableBeanFactory]
  DLBF --> Reg[BeanDefinitionRegistry]
  DLBF --> Cache[singletonObjects cache]
  AC[ApplicationContext] --> DLBF
  AC --> Events[ApplicationEventPublisher]`,
    remember: [
      'BeanFactory = getBean + lifecycle hooks.',
      'DefaultListableBeanFactory = registry + factory.',
      'ApplicationContext = BeanFactory + enterprise extras.',
      'Early ref to BeanFactory via Aware interfaces.',
    ],
    trap: 'Treating BeanFactory and ApplicationContext as unrelated — Context wraps the same factory.',
    answer60s:
      'BeanFactory is the core IoC API for retrieving beans. DefaultListableBeanFactory stores definitions and creates instances. ApplicationContext is a richer facade over the same factory with events, environment, and message sources — what Boot builds on startup.',
  },
  {
    id: 'application-context',
    title: 'ApplicationContext refresh — the startup act',
    body:
      'AbstractApplicationContext.refresh orchestrates startup: prepare bean factory, invoke BeanFactoryPostProcessors, register BeanPostProcessors, instantiate singletons, finish refresh. AnnotationConfigApplicationContext and SpringApplication run this pipeline for Boot. Failures during refresh prevent a half-initialized container from serving traffic.',
    flow: `flowchart TD
  Start[SpringApplication.run] --> Refresh[context.refresh]
  Refresh --> P1[prepareBeanFactory]
  P1 --> BFPP[invoke BeanFactoryPostProcessors]
  BFPP --> BPP[register BeanPostProcessors]
  BPP --> Inst[finishBeanFactoryInitialization]
  Inst --> Single[preInstantiateSingletons]
  Single --> Done[context started]`,
    remember: [
      'refresh() is the full startup sequence.',
      'BFPP run before any bean instance (mostly).',
      'BPP registered before singleton creation.',
      'Boot run = create context + refresh + runners.',
    ],
    trap: 'Assuming @PostConstruct runs before all BeanFactoryPostProcessors — configuration metadata is processed earlier.',
    answer60s:
      'ApplicationContext refresh is Spring startup: prepare the factory, run BeanFactoryPostProcessors to mutate definitions, register BeanPostProcessors, then create singleton beans. Boot wraps this in SpringApplication.run after environment and auto-config import.',
  },
  {
    id: 'default-listable-bean-factory',
    title: 'DefaultListableBeanFactory — registry + creation engine',
    body:
      'DefaultListableBeanFactory merges BeanDefinitionRegistry with AutowireCapableBeanFactory. It resolves dependencies, manages singleton and prototype scopes, handles circular references via early singleton exposure, and caches finished singletons. ComponentScan and @Configuration ultimately write into this registry; getBean reads from it.',
    flow: `ascii
┌─────────────────────────────────────────────────────────────┐
│ DefaultListableBeanFactory                                   │
│  beanDefinitionMap: name → BeanDefinition                    │
│  singletonObjects: name → finished bean                      │
│  earlySingletonObjects: circular ref cache                   │
│  createBean → populate → initializeBean → BPP chain          │
└─────────────────────────────────────────────────────────────┘`,
    remember: [
      'Single registry for all bean names.',
      'createBean: instantiate → populate → initialize.',
      'Singleton cache = default scope.',
      'Circular deps: early singleton exposure.',
    ],
    trap: 'Prototype injected into singleton — prototype created once at singleton init, not per call.',
    answer60s:
      'DefaultListableBeanFactory holds all BeanDefinitions and performs actual instantiation, dependency injection, and caching. It is the engine behind both classic Spring and Boot contexts.',
  },
  {
    id: 'configuration-class-pp',
    title: 'ConfigurationClassPostProcessor — @Configuration · @Bean · @Import',
    body:
      'ConfigurationClassPostProcessor is a BeanDefinitionRegistryPostProcessor that parses @Configuration classes, @ComponentScan, @Import, @PropertySource, and @Bean methods. It registers additional BeanDefinitions for @Bean factory methods and triggers component scanning via ClassPathBeanDefinitionScanner. Full @Configuration classes may be CGLIB-enhanced for proxyBeanMethods. Family: configuration and stereotype registration.',
    flow: `flowchart TD
  CCPP[ConfigurationClassPostProcessor] --> Parse[Parse @Configuration metadata]
  Parse --> Scan[@ComponentScan → scanner]
  Parse --> Bean[@Bean methods → BeanDefinition]
  Parse --> Import[@Import other configs]
  Scan --> Stereotypes[@Component @Service @Repository @Controller]
  Bean --> Reg[(registry)]`,
    remember: [
      'Processes @Configuration, @Bean, @Import, @ComponentScan.',
      '@Bean methods become factory-method definitions.',
      'CGLIB enhancement for inter-@Bean calls.',
      'Runs in BeanDefinitionRegistryPostProcessor phase.',
    ],
    trap: '@Bean method return type alone does not register — CCPP must parse the @Configuration class.',
    answer60s:
      'ConfigurationClassPostProcessor reads @Configuration classes and registers BeanDefinitions for @Bean methods and scanned stereotypes. It is the bridge from Java config annotations to the bean registry before instantiation.',
  },
  {
    id: 'autowired-annotation-bpp',
    title: 'AutowiredAnnotationBeanPostProcessor — @Autowired · @Value · @Inject',
    body:
      'AutowiredAnnotationBeanPostProcessor implements BeanPostProcessor and merges injection metadata for @Autowired, @Value, and JSR-330 @Inject on fields, setters, and constructors. It runs postProcessProperties during bean creation, resolving dependencies from the factory with @Qualifier and @Primary semantics. Optional @Autowired(required=false) skips missing beans. Family: dependency injection.',
    flow: `sequenceDiagram
  participant BF as BeanFactory
  participant AABPP as AutowiredAnnotationBeanPostProcessor
  participant B as Bean instance
  BF->>B: instantiate
  BF->>AABPP: postProcessProperties
  AABPP->>BF: resolveDependency(type, qualifier)
  AABPP->>B: inject field/setter`,
    remember: [
      'Runs after instantiate, before init callbacks.',
      'Handles @Autowired, @Value, @Inject.',
      '@Primary breaks type ambiguity.',
      'Constructor injection via same processor.',
    ],
    trap: 'Field injection “just works” in tests without context — only true with a live BeanPostProcessor chain.',
    answer60s:
      'AutowiredAnnotationBeanPostProcessor reflects injection points and asks the factory for matching beans during postProcessProperties. It powers @Autowired and @Value after the raw object is constructed.',
  },
  {
    id: 'common-annotation-bpp',
    title: 'CommonAnnotationBeanPostProcessor — JSR-250 lifecycle & resources',
    body:
      'CommonAnnotationBeanPostProcessor handles @PostConstruct, @PreDestroy, @Resource, and @ManagedBean. It registers init and destroy callbacks on the bean wrapper and performs @Resource injection by name. Runs alongside AutowiredAnnotationBeanPostProcessor in the initialization pipeline. Family: lifecycle and naming-based injection.',
    flow: `flowchart LR
  CABPP[CommonAnnotationBeanPostProcessor] --> PC[@PostConstruct → init method]
  CABPP --> PD[@PreDestroy → destroy method]
  CABPP --> Res[@Resource name-based inject]`,
    remember: [
      '@PostConstruct after injection, before initBean.',
      '@PreDestroy on context shutdown.',
      '@Resource defaults to by-name, then by-type.',
      'JSR-250 separate from @Autowired by-type.',
    ],
    trap: 'Calling @PostConstruct method manually from constructor — dependencies may still be null.',
    answer60s:
      'CommonAnnotationBeanPostProcessor wires JSR-250 annotations: @PostConstruct and @PreDestroy for lifecycle, @Resource for name-first injection. It runs during bean initialization after dependency injection.',
  },
  {
    id: 'bean-post-processor-hierarchy',
    title: 'BeanPostProcessor hierarchy — before and after init',
    body:
      'BeanPostProcessor offers postProcessBeforeInitialization and postProcessAfterInitialization hooks around InitializingBean and init methods. AutowiredAnnotationBeanPostProcessor, CommonAnnotationBeanPostProcessor, ApplicationContextAwareProcessor, and AbstractAutoProxyCreator all participate. Order matters: @Order on BPP or PriorityOrdered. InstantiationAwareBeanPostProcessor extends the chain earlier with postProcessProperties for injection.',
    flow: `flowchart TD
  Inst[instantiate] --> Pop[populate properties]
  Pop --> IAP[InstantiationAwareBPP postProcessProperties]
  IAP --> Before[BPP postProcessBeforeInitialization]
  Before --> Init[init methods / @PostConstruct]
  Init --> After[BPP postProcessAfterInitialization]
  After --> Proxy[AbstractAutoProxyCreator may replace bean]`,
    remember: [
      'Injection in postProcessProperties phase.',
      'Before init → @PostConstruct → after init.',
      'Proxy often applied in afterInitialization.',
      'Ordered BPP: PriorityOrdered then Ordered.',
    ],
    trap: 'Replacing bean in beforeInitialization and expecting injection on the replacement — use afterInitialization for proxies.',
    answer60s:
      'BeanPostProcessors wrap bean creation: injection processors run in postProcessProperties; initialization callbacks sit between before and after hooks. AbstractAutoProxyCreator typically replaces the bean with a proxy in afterInitialization.',
  },
  {
    id: 'abstract-auto-proxy-creator',
    title: 'AbstractAutoProxyCreator — AOP proxy factory',
    body:
      'AbstractAutoProxyCreator creates JDK or CGLIB proxies for beans matched by advisors. Subclasses include InfrastructureAdvisorAutoProxyCreator and AnnotationAwareAspectJAutoProxyCreator. It evaluates pointcuts at startup and wraps beans in postProcessAfterInitialization. Powers @Transactional, @Cacheable, @Async, and custom @Aspect advisors. Family: cross-cutting runtime interception.',
    flow: `flowchart TD
  AAPC[AbstractAutoProxyCreator] --> Match{Advisors apply to bean?}
  Match -->|yes| Kind{JDK or CGLIB?}
  Kind --> JDK[Interface JDK proxy]
  Kind --> CGLIB[Subclass CGLIB proxy]
  Match -->|no| Raw[Return raw bean]`,
    remember: [
      'Runs postProcessAfterInitialization.',
      'Advisors = pointcut + advice (interceptor).',
      'JDK needs interface; CGLIB subclasses target.',
      'Final methods/classes skip CGLIB advice.',
    ],
    trap: '@Transactional on private/final method — proxy exists but advice never runs.',
    answer60s:
      'AbstractAutoProxyCreator wraps beans with AOP proxies when registered advisors match. It chooses JDK or CGLIB and returns the proxy from afterInitialization, which is what external callers invoke.',
  },
  {
    id: 'infrastructure-advisor-auto-proxy',
    title: 'InfrastructureAdvisorAutoProxyCreator — infrastructure advisors first',
    body:
      'InfrastructureAdvisorAutoProxyCreator extends AbstractAutoProxyCreator and auto-applies advisors marked as infrastructure — including TransactionAttributeSourceAdvisor for @Transactional. Registered by @EnableTransactionManagement and similar enable annotations. Runs with high precedence so transactional proxies wrap targets before many custom aspects. Works with BeanFactoryPostProcessor registration of advisor beans.',
    flow: `flowchart LR
  Enable[@EnableTransactionManagement] --> IAC[InfrastructureAdvisorAutoProxyCreator]
  IAC --> Adv[TransactionAttributeSourceAdvisor]
  Adv --> Proxy[Proxy with TransactionInterceptor]`,
    remember: [
      'Infrastructure advisors = TX, some cache/async infra.',
      'Created by @Enable* annotations.',
      'High precedence vs custom @Aspect.',
      'Pairs with TransactionAttributeSource.',
    ],
    trap: 'Custom @Aspect with wrong @Order hiding transactional boundary — draw advisor onion.',
    answer60s:
      'InfrastructureAdvisorAutoProxyCreator is the auto-proxy creator for framework advisors like @Transactional. Enable transaction management registers it so TransactionInterceptor wraps matching beans early in the post-processor chain.',
  },
  {
    id: 'annotation-family-map',
    title: 'Who processes which annotation families',
    body:
      'Map annotations to the component that handles them at startup or runtime. Registration phase: ConfigurationClassPostProcessor for @Configuration, @Bean, @ComponentScan, @Import, and scanned stereotypes (@Component, @Service, @Repository, @Controller). Injection phase: AutowiredAnnotationBeanPostProcessor for @Autowired, @Value, @Inject; CommonAnnotationBeanPostProcessor for @Resource, @PostConstruct, @PreDestroy. Boot conditions: OnClassCondition, OnBeanCondition during auto-config parsing. Runtime proxies: AbstractAutoProxyCreator + advisors for @Transactional, @Cacheable, @Async, @Validated method validation, and @Aspect.',
    flow: `ascii
REGISTRATION (BeanFactoryPostProcessor / scanner)
  @Configuration @Bean @Import @ComponentScan  → ConfigurationClassPostProcessor
  @Component @Service @Repository @Controller   → ClassPathBeanDefinitionScanner
  Boot @ConditionalOn*                          → Condition evaluation + auto-config

INJECTION (BeanPostProcessor — postProcessProperties / lifecycle)
  @Autowired @Value @Inject                     → AutowiredAnnotationBeanPostProcessor
  @Resource @PostConstruct @PreDestroy          → CommonAnnotationBeanPostProcessor

RUNTIME PROXY (BeanPostProcessor — afterInitialization)
  @Transactional                                → InfrastructureAdvisorAutoProxyCreator + TX advisor
  @Cacheable @CacheEvict                        → CacheInterceptor advisor
  @Async                                        → AsyncAnnotationBeanPostProcessor + async advisor
  Custom @Aspect                                → AnnotationAwareAspectJAutoProxyCreator`,
    remember: [
      'Register → inject → proxy — three different processor types.',
      'Stereotypes register early; TX intercepts at call time.',
      'Self-invocation bypasses all runtime advisors.',
      'Boot conditions gate registration, not method calls.',
    ],
    trap: 'Looking for “TransactionalAnnotationProcessor” at scan time — TX is advisor + proxy, not a scanner.',
    answer60s:
      'ConfigurationClassPostProcessor registers stereotype and @Bean definitions. AutowiredAnnotationBeanPostProcessor and CommonAnnotationBeanPostProcessor handle injection and JSR-250 lifecycle. AbstractAutoProxyCreator and InfrastructureAdvisorAutoProxyCreator wrap beans for @Transactional, @Cacheable, and @Async at initialization. Know which phase each family belongs to.',
  },
];
