import type {StoryBeat} from './types';

/** Memorable Mermaid interview stories — lead with SCAN → REGISTER → INJECT → PROXY → EXECUTE. */
export const SA_STORIES: StoryBeat[] = [
  {
    id: 'not-magic',
    title: 'Annotation is not magic — five phases',
    badge: 'THE mental model',
    hook: 'Open every Spring answer with this pipeline before naming a single annotation.',
    mermaid: `flowchart LR
  S[SCAN classpath] --> R[REGISTER BeanDefinitions]
  R --> I[INJECT dependencies]
  I --> P[POST-PROCESS + PROXY]
  P --> E[EXECUTE method call]
  style S fill:#e8f4fc
  style R fill:#e8f4fc
  style I fill:#fff3cd
  style P fill:#f8d7da
  style E fill:#d4edda`,
    say:
      'Spring annotations are not runtime magic. At startup, the container scans classes, registers BeanDefinitions, injects dependencies via BeanPostProcessors, wraps beans in proxies where needed, and only then executes your code. At runtime, cross-cutting annotations like Transactional or Cacheable intercept calls on the proxy — not on raw this inside the class.',
    memory: 'SCAN → REGISTER → INJECT → PROXY → EXECUTE. Self-invocation skips PROXY.',
  },
  {
    id: 'component-scan',
    title: '@Component scan → BeanDefinition',
    badge: 'REGISTER',
    hook: 'Scan does not create objects — it registers recipes.',
    mermaid: `flowchart TD
  A[@SpringBootApplication] --> B[ComponentScan basePackages]
  B --> C[ClassPathBeanDefinitionScanner]
  C --> D{Stereotype?}
  D -->|@Component @Service @Repository @Controller| E[ScannedGenericBeanDefinition]
  D -->|@Configuration| F[ConfigurationClassBeanDefinition]
  E --> G[(BeanDefinitionRegistry)]
  F --> G
  G --> H[Later: instantiate + inject]`,
    say:
      'When Boot starts, ComponentScan tells ClassPathBeanDefinitionScanner to walk the classpath. Each stereotype becomes a BeanDefinition — a recipe with bean class, scope, lazy flag, and constructor metadata. No PaymentService object exists yet. The registry holds names like paymentService pointing at that recipe. Interview trap: thinking @Component creates a singleton immediately.',
    memory: 'Scan = recipes in registry. Objects come later at refresh.',
  },
  {
    id: 'autowired-inject',
    title: '@Autowired via AutowiredAnnotationBeanPostProcessor',
    badge: 'INJECT',
    hook: 'Injection happens after the raw object exists, before init callbacks.',
    mermaid: `sequenceDiagram
  participant BF as BeanFactory
  participant BPP as AutowiredAnnotationBeanPostProcessor
  participant Bean as OrderService
  participant Dep as PaymentClient
  BF->>Bean: instantiate OrderService
  BF->>BPP: postProcessProperties(bean)
  BPP->>BPP: find @Autowired fields/setters/ctors
  BPP->>BF: resolveBean(PaymentClient)
  BF-->>BPP: paymentClient proxy or raw
  BPP->>Bean: inject field
  Note over Bean: @PostConstruct runs after injection`,
    say:
      'After the container constructs a raw bean, AutowiredAnnotationBeanPostProcessor runs in the postProcessProperties phase. It reflects over fields, setters, and constructors marked @Autowired, asks the BeanFactory for matching types — honoring @Qualifier and @Primary — and wires references. Circular dependencies may use early singleton exposure. This is not constructor magic from Lombok; it is explicit framework processing order.',
    memory: 'Raw object first → AutowiredAnnotationBeanPostProcessor wires → @PostConstruct last.',
  },
  {
    id: 'transactional-self-invoke',
    title: '@Transactional proxy + self-invocation trap',
    badge: 'PROXY trap',
    hook: 'The classic staff question: why did my transaction not roll back?',
    mermaid: `flowchart TD
  Client[External caller] --> Proxy[OrderService$$SpringCGLIB$$ proxy]
  Proxy --> TX1[TransactionInterceptor opens TX]
  TX1 --> Target[OrderService.save]
  Target --> Self[this.process — internal call]
  Self --> Raw[Direct method — NO proxy]
  Raw --> TX2[No interceptor — TX not applied]
  style Self fill:#f8d7da
  style Raw fill:#f8d7da`,
    say:
      'External callers hit a proxy. TransactionInterceptor opens a connection-bound transaction around save. Inside save, this.process is a direct call on the raw object — it bypasses the proxy, so no transaction advice runs and rollback rules vanish. Fix: inject self, move method to another bean, or use AspectJ weaving. Always draw caller → proxy → target vs this → target.',
    memory: 'External → proxy → TX. this.method → no proxy → no TX.',
  },
  {
    id: 'configuration-cglib',
    title: '@Configuration CGLIB + proxyBeanMethods',
    badge: 'REGISTER · PROXY',
    hook: 'Two @Bean methods calling each other — singleton or two instances?',
    mermaid: `flowchart LR
  subgraph proxyBeanMethods_true [proxyBeanMethods=true default]
    C1[@Configuration CGLIB subclass]
    C1 --> M1[@Bean dataSource]
    C1 --> M2[@Bean entityManagerFactory]
    M2 -->|calls| M1
    M1 --> One[Same singleton DS]
  end
  subgraph proxyBeanMethods_false [proxyBeanMethods=false]
    C2[Plain @Configuration]
    C2 --> N1[dataSource bean]
    C2 --> N2[entityManagerFactory bean]
    N2 -->|calls| N1
    N1 --> Two[Two DataSource instances]
  end`,
    say:
      'Full @Configuration classes are CGLIB-enhanced so @Bean methods invoked from other @Bean methods route through the container and return singletons. With proxyBeanMethods false — common in @TestConfiguration for speed — each @Bean method call is a plain Java call and may create duplicate instances. Light @Configuration without inter-bean calls can skip full enhancement in Boot 3.',
    memory: 'Full @Configuration + proxyBeanMethods=true → @Bean calls share singletons.',
  },
  {
    id: 'async-no-tx',
    title: '@Async new thread / no TX propagation',
    badge: 'EXECUTE trap',
    hook: 'Async feels like “same request” but it is a different thread with no transaction.',
    mermaid: `sequenceDiagram
  participant Ctrl as Controller
  participant Svc as ReportService proxy
  participant TX as TransactionInterceptor
  participant Pool as TaskExecutor thread
  Ctrl->>Svc: generateReport
  Svc->>TX: TX open on http thread
  Svc->>Pool: @Async archive — hand off
  Note over Pool: New thread — TX NOT propagated
  Pool->>Pool: writeAuditLog — no session
  TX->>TX: commit on http thread`,
    say:
      'Transactional work runs on the request thread with a bound EntityManager. @Async methods execute on a thread pool via AsyncAnnotationBeanPostProcessor and AsyncExecutionInterceptor. Spring does not propagate thread-local transactions to async workers unless you explicitly pass work into a transactional boundary or use TransactionTemplate. Symptom: LazyInitializationException or silent non-participation in rollback.',
    memory: '@Async = new thread. TX stays on caller thread unless you design propagation.',
  },
  {
    id: 'cacheable-self-invoke',
    title: '@Cacheable self-invocation miss',
    badge: 'PROXY trap',
    hook: 'Cache hit in unit test, miss in production — same bug as Transactional.',
    mermaid: `flowchart TD
  Ext[Controller] --> P[ProductService proxy]
  P --> CI[CacheInterceptor]
  CI -->|miss| DB[(Database)]
  CI -->|put cache| P2[loadProduct]
  P2 --> Self[this.getPrice internal]
  Self --> Raw[No CacheInterceptor]
  Raw --> DB2[(Database again)]
  style Self fill:#f8d7da`,
    say:
      'CacheInterceptor wraps external calls through the proxy and stores results in CacheManager. Internal this.getPrice never passes the interceptor, so @Cacheable is ignored and every internal call hits the database. The fix mirrors transactional self-invocation: delegate to another bean or inject self. Debugging tip: enable cache logging and count get calls — two hits for one logical operation screams self-invocation.',
    memory: '@Cacheable only on proxy path. this → cache miss every time.',
  },
  {
    id: 'boot-auto-config',
    title: 'Boot auto-config condition pipeline',
    badge: 'REGISTER',
    hook: 'Boot is conditional BeanDefinition registration — not classpath scanning alone.',
    mermaid: `flowchart TD
  Boot[@SpringBootApplication] --> AC[@EnableAutoConfiguration]
  AC --> Imp[AutoConfigurationImportSelector]
  Imp --> List[Load META-INF/spring/*.imports]
  List --> Eval{Condition pipeline}
  Eval --> C1[@ConditionalOnClass on classpath?]
  C1 --> C2[@ConditionalOnMissingBean user override?]
  C2 --> C3[@ConditionalOnProperty flag?]
  C3 -->|all match| Reg[Register @Configuration beans]
  C3 -->|fail| Skip[Skip quietly]
  Reg --> BF[(BeanDefinitionRegistry)]`,
    say:
      'Spring Boot loads auto-configuration classes from spring.factories or AutoConfiguration.imports. Each class is gated by @ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty, and friends evaluated by ConfigurationCondition implementations during the configuration phase — before bean instantiation. User @Bean methods win via @ConditionalOnMissingBean. Interview gold: auto-config never overrides explicit user beans.',
    memory: 'Auto-config = conditional recipes. OnClass + MissingBean + Property gates.',
  },
  {
    id: 'advisor-nesting',
    title: 'Multiple advisors nesting (@Transactional + @Async + @Cacheable)',
    badge: 'PROXY stack',
    hook: 'Order matters — draw onion layers from outside in.',
    mermaid: `flowchart TB
  Caller[Caller] --> L1[CacheInterceptor outer?]
  L1 --> L2[AsyncInterceptor]
  L2 --> L3[TransactionInterceptor inner?]
  L3 --> Target[Business method]
  Note1[Order: @Order on advisors / EnableAsync order]
  Note2[Self-invocation skips entire stack]`,
    say:
      'Infrastructure advisors stack as nested interceptors on one proxy. Transactional, Async, and Cacheable each register an advisor; invocation proceeds outer-to-inner based on @Order and advisor registration order. Async outermost means cache may key before thread hop; transactional innermost is common for database work. Staff follow-up: self-invocation skips the entire onion. Document your team order in code review.',
    memory: 'One proxy, many interceptors — order + self-invocation decide behavior.',
  },
  {
    id: 'jdk-vs-cglib',
    title: 'JDK vs CGLIB proxy choice',
    badge: 'PROXY',
    hook: 'Final classes and interfaces — the proxy pop quiz.',
    mermaid: `flowchart TD
  Q{Target has interface?}
  Q -->|yes default| JDK[JDK dynamic proxy]
  Q -->|no or proxyTargetClass=true| CGLIB[CGLIB subclass proxy]
  JDK --> I[Proxy implements interface]
  CGLIB --> S[Extends concrete class]
  Final[@Transactional on final method] --> Fail[CGLIB cannot override — advice skipped]
  style Final fill:#f8d7da`,
    say:
      'By default Spring AOP uses JDK dynamic proxies when the bean implements interfaces — the proxy implements the same interfaces and delegates to the target. Without interfaces or with spring.aop.proxy-target-class=true, Boot uses CGLIB subclasses. CGLIB cannot advise final methods or classes. @Transactional on a final method silently fails. For concrete @Service classes without interfaces, Boot 2.2+ defaults to CGLIB.',
    memory: 'Interface → JDK proxy. Concrete / proxyTargetClass → CGLIB. Final = no advice.',
  },
];

/** Pocket memory cards — flash before the whiteboard. */
export const MEMORY_STRIP: {title: string; line: string}[] = [
  {title: 'Five phases', line: 'SCAN → REGISTER → INJECT → PROXY → EXECUTE'},
  {title: 'Scan', line: 'Recipes, not objects'},
  {title: '@Autowired', line: 'BPP after instantiate'},
  {title: 'Self-invoke', line: 'this skips proxy'},
  {title: '@Configuration', line: 'CGLIB shares @Bean singletons'},
  {title: '@Async', line: 'New thread, no TX'},
  {title: 'Auto-config', line: 'ConditionalOn* gates'},
  {title: 'Proxy pick', line: 'JDK vs CGLIB + final trap'},
];

/** 6-step whiteboard path — "How does @Transactional work?" */
export const WHITEBOARD_BEATS: StoryBeat[] = [
  {
    id: 'tx-b1',
    title: '1. Enable transaction management',
    badge: 'Whiteboard',
    hook: 'Draw @EnableTransactionManagement → InfrastructureAdvisorAutoProxyCreator.',
    mermaid: `flowchart LR
  ETM[@EnableTransactionManagement] --> IAC[InfrastructureAdvisorAutoProxyCreator]
  IAC --> Reg[Register TransactionAttributeSourceAdvisor]`,
    say:
      '@EnableTransactionManagement imports infrastructure that registers a TransactionAttributeSourceAdvisor. InfrastructureAdvisorAutoProxyCreator wraps matching beans early because it implements BeanFactoryPostProcessor semantics for advisor detection.',
    memory: 'Enable TX → advisor auto-proxy creator registers TX advisor.',
  },
  {
    id: 'tx-b2',
    title: '2. Parse @Transactional metadata',
    badge: 'Whiteboard',
    hook: 'Annotation becomes TransactionAttribute on methods/classes.',
    mermaid: `flowchart TD
  Ann[@Transactional on class/method] --> TAS[AnnotationTransactionAttributeSource]
  TAS --> Attr[TransactionAttribute propagation/isolation/rollbackFor]`,
    say:
      'Spring reads @Transactional via AnnotationTransactionAttributeSource and builds TransactionAttribute objects — propagation, isolation, timeout, readOnly, rollback rules. Method-level overrides class-level.',
    memory: 'Metadata → TransactionAttribute before any call.',
  },
  {
    id: 'tx-b3',
    title: '3. Match bean → create proxy',
    badge: 'Whiteboard',
    hook: 'AbstractAutoProxyCreator wraps eligible beans at init.',
    mermaid: `flowchart LR
  Bean[OrderService bean] --> AAP[AbstractAutoProxyCreator.postProcessAfterInitialization]
  AAP --> Adv{Advisor applies?}
  Adv -->|yes| Proxy[OrderService$$SpringCGLIB$$]`,
    say:
      'AbstractAutoProxyCreator runs after bean initialization. If TransactionAttributeSourceAdvisor matches joinpoints on the bean, Spring creates a JDK or CGLIB proxy wrapping the target.',
    memory: 'Post-init → proxy if advisor matches joinpoints.',
  },
  {
    id: 'tx-b4',
    title: '4. External call → interceptor chain',
    badge: 'Whiteboard',
    hook: 'Draw caller hitting proxy, not target.',
    mermaid: `sequenceDiagram
  participant C as Client
  participant P as Proxy
  participant TI as TransactionInterceptor
  participant T as Target
  C->>P: saveOrder
  P->>TI: invoke
  TI->>T: proceed after TX begin`,
    say:
      'External callers invoke the proxy. TransactionInterceptor opens or joins a transaction via PlatformTransactionManager, then calls proceed on the target method.',
    memory: 'Client → proxy → TransactionInterceptor → target.',
  },
  {
    id: 'tx-b5',
    title: '5. Commit, rollback, or self-invocation trap',
    badge: 'Whiteboard',
    hook: 'Close the loop — and draw the this trap.',
    mermaid: `flowchart TD
  TI[TransactionInterceptor] --> TM[PlatformTransactionManager]
  TM -->|success| Commit[commit]
  TM -->|RuntimeException + rollbackFor| Roll[rollback]
  Self[this.internalCall] --> Skip[Bypass proxy — no TX]
  style Skip fill:#f8d7da`,
    say:
      'On normal completion the interceptor commits; unchecked exceptions roll back per rollback rules. Internal this calls bypass the proxy — draw that fork as the staff trap.',
    memory: 'Interceptor owns commit/rollback. this bypasses it.',
  },
  {
    id: 'tx-b6',
    title: '6. Close — tie to mental model',
    badge: 'Whiteboard',
    hook: 'Land the 60-second answer.',
    mermaid: `flowchart LR
  Scan[SCAN @Service] --> Reg[REGISTER definition]
  Reg --> Inject[INJECT deps]
  Inject --> Proxy[PROXY + TX advisor]
  Proxy --> Exec[EXECUTE via interceptor]`,
    say:
      'Close: @Transactional is metadata at startup and an interceptor at runtime. The container registers the bean, injects dependencies, wraps it in a proxy with TransactionInterceptor, and external calls participate in transactions. Self-invocation skips the proxy.',
    memory: 'TX = metadata + proxy + interceptor. Not magic on this.',
  },
];


/** Flash debug picks — architect interview reflex. */
export const ARCHITECT_PICKS: {
  id: string;
  symptom: string;
  answer: string;
  say: string;
  fix: string;
}[] = [
  {
    id: 'd1',
    symptom: '@Transactional on save() — but this.process() inside does not roll back',
    answer: 'Self-invocation',
    say: 'Internal this call bypasses the proxy — TransactionInterceptor never runs.',
    fix: 'Move to another bean, inject self, or AspectJ. Never rely on this.@Transactional.',
  },
  {
    id: 'd2',
    symptom: '@Async method runs, but DB changes from caller TX are invisible / no session',
    answer: 'New thread',
    say: '@Async hands off to another thread — transaction does not propagate.',
    fix: 'Do DB work before async, or open a new TX on the async method via proxy call.',
  },
  {
    id: 'd3',
    symptom: 'Two DataSource beans created from @Bean methods calling each other',
    answer: 'proxyBeanMethods=false',
    say: 'Lite @Configuration: inter-@Bean calls are plain Java → new instances.',
    fix: 'Keep proxyBeanMethods=true (default) for shared singletons, or inject the bean.',
  },
  {
    id: 'd4',
    symptom: '@Cacheable never hits cache on method called from same class',
    answer: 'Self-invocation',
    say: 'Same trap as TX — cache advice is on the proxy only.',
    fix: 'Call through another bean / self-injection.',
  },
  {
    id: 'd5',
    symptom: 'NoUniqueBeanDefinitionException for PaymentClient',
    answer: '@Qualifier / @Primary',
    say: 'Multiple beans of same type — container cannot choose.',
    fix: '@Primary on default, or @Qualifier on injection point.',
  },
  {
    id: 'd6',
    symptom: '@Transactional rollback does not happen on checked Exception',
    answer: 'Default rollback rules',
    say: 'By default only unchecked RuntimeException / Error roll back.',
    fix: 'rollbackFor = Exception.class when needed.',
  },
  {
    id: 'd7',
    symptom: 'Custom starter beans never appear',
    answer: 'Auto-config not loaded',
    say: 'Boot 3 loads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports — not old spring.factories alone.',
    fix: 'Add imports file + @ConditionalOnClass; check --debug condition report.',
  },
  {
    id: 'd8',
    symptom: '@PreAuthorize ignored on service method',
    answer: 'No proxy / wrong call path',
    say: 'Security is AOP advice — needs @EnableMethodSecurity and external call through proxy.',
    fix: 'Enable method security; call from controller/other bean, not this.',
  },
];

export const ARCHITECT_CHEAT = `
SPRING ANNOTATIONS — ARCHITECT CHEAT (interview)

MENTAL MODEL (say this first)
  SCAN classpath
    → REGISTER BeanDefinitions (recipes)
    → INJECT (@Autowired BPP)
    → PROXY (TX / Async / Cache / Security)
    → EXECUTE

GOLDEN RULE
  Advice runs only when the call enters the proxy.
  this.foo() = raw object = no @Transactional / @Async / @Cacheable / @PreAuthorize

MUST-DRAW STORIES
  1. Self-invocation TX trap
  2. @Configuration CGLIB vs proxyBeanMethods=false
  3. @Async new thread (no TX)
  4. Boot: ConditionalOnClass → ConditionalOnMissingBean

COMMON ANNOTATIONS (roles, not encyclopedia)
  @Component/@Service/@Repository/@Controller → stereotype scan
  @Configuration + @Bean              → manual beans / CGLIB
  @Autowired / ctor injection         → AutowiredAnnotationBeanPostProcessor
  @Transactional                      → TransactionInterceptor on proxy
  @Async                              → executor hand-off
  @Cacheable                          → cache advice on proxy
  @SpringBootApplication              → scan + auto-config imports
  @RestController / @RequestMapping   → MVC mapping
  @Valid / @Validated                 → validation

DEBUG ORDER
  1. Is there a proxy in the stack?
  2. Is the call external or this.?
  3. Which BeanPostProcessor / advisor owns it?
  4. Boot: --debug condition report

DO NOT
  Memorize 200 annotations
  Put @Transactional on controllers
  Expect TX to follow @Async
  Tattoo "Spring is magic"
`;
