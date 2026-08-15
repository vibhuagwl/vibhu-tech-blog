import type {AnnotationCard} from './types';

export const CONFIG: AnnotationCard[] = [
  {
    id: 'configuration',
    annotation: '@Configuration',
    family: 'config',
    what:
      '@Target(TYPE) marker for a class that declares @Bean methods and/or imports other configuration. Meta-annotated with @Component so it is picked up by component scanning. In Spring Framework 6, proxyBeanMethods defaults to true — the configuration class is CGLIB-subclassed so @Bean method inter-calls return the same singleton from the container.',
    why:
      'Java-based replacement for XML <beans>. Groups factory methods with explicit dependency wiring. proxyBeanMethods=true preserves singleton semantics when one @Bean method calls another @Bean method on the same class. Full-mode vs lite-mode (@Configuration(proxyBeanMethods=false)) trades correctness for faster startup.',
    example: `@Configuration(proxyBeanMethods = true) // default in Boot 3
public class DataSourceConfig {

  @Bean
  public DataSource dataSource() {
    return DataSourceBuilder.create().url("jdbc:postgresql://localhost/app").build();
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    // parameter injection — container resolves DataSource bean
    return new JdbcTemplate(dataSource);
  }

  @Bean
  public PlatformTransactionManager txManager(DataSource dataSource) {
  return new DataSourceTransactionManager(dataSource);
  }
}`,
    processor:
      'ClassPathBeanDefinitionScanner registers @Configuration as a @Component. ConfigurationClassPostProcessor (BeanDefinitionRegistryPostProcessor) parses the class: processes @ComponentScan, @Import, @Bean methods. For full @Configuration (proxyBeanMethods=true), ConfigurationClassEnhancer CGLIB-enhances the class so @Bean inter-calls go through the proxy → container getBean. For lite mode (proxyBeanMethods=false), @Bean methods are processed as static factory metadata without subclass proxy — inter-calls bypass container.',
    when:
      'Central Java config for beans not auto-configured by Boot. Library modules exporting @Bean factories. Use proxyBeanMethods=false for simple stateless @Bean declarations when no @Bean-to-@Bean calls on same class.',
    flow: `1. Scanner registers @Configuration class BeanDefinition
2. ConfigurationClassPostProcessor parses @Configuration metadata
3. If proxyBeanMethods=true → enhanceConfigurationClasses (CGLIB subclass registered)
4. ConfigurationClassBeanDefinitionReader loads @Bean method definitions
5. Each @Bean → RootBeanDefinition with factoryBeanName=configClass, factoryMethodName
6. Context instantiates enhanced @Configuration proxy (singleton)
7. Container calls @Bean factory methods via proxy for singleton caching
8. @Bean method parameters resolved via AutowiredAnnotationBeanPostProcessor logic on factory method`,
    lifecycle:
      '@Configuration class itself is a singleton bean, created early. @Bean methods invoked lazily when dependent beans need them (unless pre-instantiated). Enhanced config class lives for application lifetime.',
    proxy:
      'proxyBeanMethods=true: CGLIB proxy of @Configuration class — @Bean method calls intercepted by ConfigurationClassEnhancer.BeanMethodInterceptor to return existing singleton from bean factory. proxyBeanMethods=false (lite): no config class proxy; direct method calls create new instances (broken singleton if inter-calling @Bean methods).',
    runtime:
      'Enhanced @Configuration is a singleton proxy. Calling config.jdbcTemplate() from another @Bean method in same class hits the proxy → same JdbcTemplate bean. External code should get beans via injection, not calling @Bean methods directly.',
    failure:
      'BeanCurrentlyInCreationException — circular @Bean dependencies. ConflictingBeanDefinition — duplicate @Bean names. final @Configuration class cannot be CGLIB-enhanced. @Bean method private/static — not valid factory methods in standard processing.',
    debug:
      'DEBUG org.springframework.context.annotation.ConfigurationClassEnhancer shows CGLIB enhancement. Verify lite vs full: @Configuration(proxyBeanMethods=false). Check bean definition: factoryMethodName on RootBeanDefinition.',
    production:
      'Prefer Boot auto-configuration when available. Use @Configuration(proxyBeanMethods=false) in @AutoConfiguration for speed when no inter-bean calls. Constructor injection on @Bean method parameters over calling other @Bean methods when possible. Avoid heavy work in @Bean methods — they run at startup.',
    mistakes: [
      'Calling @Bean methods from non-@Bean code expecting singleton — bypasses proxy',
      'proxyBeanMethods=false with @Bean methods calling each other — multiple instances',
      'Making @Configuration class final — CGLIB enhancement fails',
      'Using @Component instead of @Configuration for @Bean methods — @Bean not processed',
      'Heavy I/O in @Bean method slowing startup',
    ],
    traps: [
      'Lite @Configuration + this.otherBean() creates new instance every call — classic interview',
      'Singleton @Configuration but prototype @Bean — new prototype each getBean, cached only per factory invocation rules',
      '@Configuration inner class must be static for separate bean registration',
      'Boot 2 vs 3: proxyBeanMethods default changed to true in Spring Framework 5.2+ / Boot 2.2+',
    ],
    answer15s:
      '@Configuration marks a class declaring @Bean methods. Default proxyBeanMethods=true CGLIB-enhances the class so inter-@Bean calls return container singletons. Parsed by ConfigurationClassPostProcessor.',
    answer60s:
      '@Configuration is a @Component processed by ConfigurationClassPostProcessor. It registers @Bean factory methods and honors @Import/@ComponentScan. proxyBeanMethods=true (default): CGLIB proxy intercepts @Bean method calls on same class to reuse singleton beans. false = lite mode, faster but @Bean inter-calls break singleton semantics. @Bean method parameters are dependency-injected by type/name.',
    answer3m:
      'Full pipeline: scan → ConfigurationClassPostProcessor → parse metadata → optionally ConfigurationClassEnhancer CGLIB subclass → ConfigurationClassBeanDefinitionReader registers factory methods. BeanMethodInterceptor: if @Bean method called through proxy, delegate to container getBean(name). Lite mode skips enhancer — direct Java calls. Singleton guarantee: one enhanced config instance; @Bean default singleton scope. Contrast @Component: only @Configuration triggers @Bean parsing. Boot @AutoConfiguration is meta @Configuration often with proxyBeanMethods=false. Production: prefer parameter injection between @Beans; use false in auto-config modules. Debug enhancement and factory method definitions.',
    memory: 'CONFIGURATION = @Bean factory + CGLIB proxy when proxyBeanMethods=true.',
    tables: [
      {
        headers: ['proxyBeanMethods', 'CGLIB config proxy', '@Bean inter-call behavior', 'Use when'],
        rows: [
          ['true (default)', 'Yes — ConfigurationClassEnhancer', 'Returns singleton from container', 'Beans call other @Bean methods on same class'],
          ['false (lite)', 'No', 'Plain Java call — new object each time', 'Simple independent @Beans; Boot auto-config'],
        ],
      },
    ],
  },
  {
    id: 'bean',
    annotation: '@Bean',
    family: 'config',
    what:
      '@Target(METHOD|ANNOTATION_TYPE) factory annotation on @Configuration (or @Component in Boot) methods. Registers a BeanDefinition whose instance is produced by invoking the annotated method on the configuration class instance. Supports name/value, initMethod, destroyMethod, autowireCandidate, role attributes.',
    why:
      'Explicit programmatic construction when constructor injection on a third-party class is impossible or when conditional logic is needed. Integrates third-party libraries (ObjectMapper, RestTemplate) into the Spring context with full lifecycle management.',
    example: `@Configuration
public class JacksonConfig {

  @Bean
  public ObjectMapper objectMapper(List<Module> modules) {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModules(modules); // all Module beans injected
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper;
  }

  @Bean(name = "auditRestTemplate")
  public RestTemplate auditRestTemplate(RestTemplateBuilder builder) {
    return builder.setConnectTimeout(Duration.ofSeconds(2)).build();
  }
}`,
    processor:
      'ConfigurationClassBeanDefinitionReader processes @Bean methods during ConfigurationClassPostProcessor phase. Creates RootBeanDefinition with factoryBeanName pointing to @Configuration bean and factoryMethodName. Default scope singleton. @Bean method parameters create DependencyDescriptor entries resolved at factory invocation time via DefaultListableBeanFactory.resolveDependency — same algorithm as @Autowired (by type, @Qualifier, @Primary).',
    when:
      'Third-party types, multi-step object graphs, conditional beans (@Conditional on @Configuration class). Prefer @Component on your own classes when no factory logic needed.',
    flow: `1. ConfigurationClassPostProcessor parses @Bean method → BeanDefinition
2. Context instantiates @Configuration (possibly CGLIB proxy)
3. Another bean needs ObjectMapper → factory invocation scheduled
4. resolveDependency for each @Bean method parameter (List<Module> → all Module beans)
5. Reflective invoke configurationProxy.objectMapper(modules)
6. Return value registered as singleton in factory singleton cache
7. @PreDestroy / destroyMethod on container shutdown`,
    lifecycle:
      'Singleton @Bean: one invocation cached (when through config proxy or container). Prototype @Bean: new instance per getBean. initMethod runs after properties set; destroyMethod on context close.',
    proxy:
      '@Bean does not proxy the returned object unless you wrap it or the return type is advised. The @Configuration class proxy ensures singleton @Bean method idempotency. Returned @Bean can be AOP-proxied if @Transactional etc.',
    runtime:
      'Container stores factory metadata; materializes bean on demand. Parameter resolution uses active autowire context — same beans as field injection.',
    failure:
      'UnsatisfiedDependencyException on @Bean parameter — missing bean. BeanNotOfRequiredTypeException. Factory method threw exception → BeanCreationException with cause. Ambiguous parameter — multiple candidates without @Qualifier.',
    debug:
      'TRACE org.springframework.beans.factory.support.DefaultListableBeanFactory for dependency resolution. Inspect BeanDefinition: factoryMethodName, factoryBeanName. breakpoints on @Bean method.',
    production:
      'Name beans when multiple same type (@Bean("primaryKafkaTemplate")). Use @ConditionalOnMissingBean in Boot auto-config. Keep factory methods small. Prefer RestTemplateBuilder/WebClient.Builder beans from Boot.',
    mistakes: [
      'Invoking @Bean method directly from application code instead of injection',
      'Expecting new instance on each direct call without going through container',
      'Missing @Configuration(proxyBeanMethods=true) when @Bean methods call each other',
      'Registering same type twice without @Primary',
      'Prototype @Bean injected into singleton — shared reference bug',
    ],
    traps: [
      '@Bean on @Component method works in Boot but inter-call singleton broken without full @Configuration',
      '@Bean method return type concrete class but @Autowired interface — need @Bean return interface or qualifier',
      'List<T> parameter injects ALL beans of type T — surprises with zero or many',
      'destroyMethod inference (Boot) may call close() on unintended beans',
    ],
    answer15s:
      '@Bean registers a factory method on @Configuration. The container invokes it to create the bean; method parameters are dependency-injected like @Autowired.',
    answer60s:
      '@Bean on @Configuration methods is parsed into RootBeanDefinition with factory metadata. Singleton by default; parameters resolved via resolveDependency (type, @Qualifier, @Primary). With proxyBeanMethods=true, repeated calls through config proxy return same instance. Use for third-party objects and explicit wiring.',
    answer3m:
      'ConfigurationClassBeanDefinitionReader registers factory methods. At creation, DefaultListableBeanFactory calls configuration bean method with autowired parameters — DependencyDescriptor per parameter, CandidateResolver considers @Primary and @Qualifier. Inter-@Bean calls: must go through CGLIB-enhanced @Configuration or use parameter injection. Scopes: singleton vs prototype. init/destroy lifecycle. Boot: @ConditionalOnMissingBean pattern. Contrast @Component: @Bean is factory registration. Failures: ambiguity, circular factory deps. @Bean List<Module> collects all Module type beans.',
    memory: '@BEAN = factory method; params = DI; singleton via config CGLIB proxy.',
    tables: [
      {
        headers: ['@Bean parameter', 'Resolution', 'Same as field injection?'],
        rows: [
          ['Single type', 'resolveDependency by type + @Qualifier/@Primary', 'Yes'],
          ['Optional<T>', 'Empty if missing (if optional)', 'Yes'],
          ['List<T>', 'All beans assignable to T', 'Yes — collection injection'],
          ['Map<String, T>', 'Bean name → instance map', 'Yes'],
          ['@Value param', 'Property placeholder resolution', 'Yes — @Autowired not required with @Value'],
        ],
      },
    ],
  },
  {
    id: 'import',
    annotation: '@Import',
    family: 'config',
    what:
      '@Target(TYPE) imports additional @Configuration classes, ImportSelector, DeferredImportSelector, or ImportBeanDefinitionRegistrar implementations into the parsing set processed by ConfigurationClassPostProcessor. Can appear on @Configuration or @SpringBootApplication.',
    why:
      'Modularize configuration without component-scanning entire packages. Boot auto-configuration chains use @Import heavily. Extension points (ImportSelector) enable conditional or ordered registration of configuration classes.',
    example: `@Configuration
@Import({KafkaConfig.class, MetricsConfig.class})
public class AppConfig {}

// Boot style — selector picks configs
@AutoConfiguration
@Import(MyRegistrar.class)
public class MyAutoConfiguration {}

public class MyImportSelector implements ImportSelector {
  @Override
  public String[] selectImports(AnnotationMetadata importingClassMetadata) {
    return new String[] {EnabledKafkaConfig.class.getName()};
  }
}`,
    processor:
      'ConfigurationClassParser.processImports during ConfigurationClassPostProcessor. Handles: (1) regular @Configuration classes — recurse parse; (2) ImportSelector — call selectImports immediately, import returned class names; (3) DeferredImportSelector — collect, process after all @Configuration parsed (ordering for auto-config); (4) ImportBeanDefinitionRegistrar — registerBeanDefinitions(registry, importingMetadata) for programmatic BeanDefinition registration.',
    when:
      'Split configuration modules. Implement ImportSelector for feature flags. DeferredImportSelector for Boot auto-config ordering (@AutoConfiguration). ImportBeanDefinitionRegistrar for beans that cannot be @Bean methods.',
    flow: `1. ConfigurationClassParser parses @Configuration
2. Encounters @Import → processImports
3. ImportSelector.selectImports() → array of FQCN → enqueue as ConfigurationClass
4. DeferredImportSelector deferred until all configurations parsed → then selectImports
5. ImportBeanDefinitionRegistrar.registerBeanDefinitions() writes directly to BeanDefinitionRegistry
6. Recursively parse imported @Configuration classes
7. BeanFactoryPostProcessors run on complete registry`,
    lifecycle:
      'Import processing during single context refresh bootstrap — before bean instantiation. Deferred selectors run in ConfigurationClassPostProcessor.processConfigBeanDefinitions late phase.',
    proxy:
      'No proxy on @Import itself. Imported @Configuration classes follow their own proxyBeanMethods rules.',
    runtime:
      '@Import is compile-time/bootstrap metadata only — no runtime bean. Effect is which definitions exist.',
    failure:
      'ClassNotFoundException in selectImports return value. Circular @Import between configs. Registrar typo in bean name. DeferredImportSelector ordering surprises — bean missing because selector ran too late.',
    debug:
      'DEBUG ConfigurationClassParser logs processed imports. Boot: ConditionEvaluationReport for auto-config. Trace ImportSelector return arrays.',
    production:
      'Prefer @AutoConfiguration.imports (Boot 3) over spring.factories. Keep ImportSelector logic fast — runs at startup. Document custom registrars. Avoid importing huge config graphs unnecessarily.',
    mistakes: [
      'Returning class names from selectImports that are not @Configuration and not registrars',
      'Using ImportSelector for runtime decisions — it runs once at startup',
      'Circular @Import between two @Configuration classes',
      'Forgetting @Configuration on imported class that only has @Bean methods',
      'Mixing @Import with duplicate @ComponentScan overlap',
    ],
    traps: [
      'DeferredImportSelector runs AFTER user @Configuration — enables Boot auto-config to back off',
      'ImportBeanDefinitionRegistrar can register beans without @Bean — bypasses @ConditionalOnBean unless careful',
      'selectImports must return FQCN strings, not Class literals in older APIs',
      '@Import on wrong class not being parsed — must be reachable from scanned @Configuration',
    ],
    answer15s:
      '@Import pulls other configuration classes or ImportSelector/Registrar into the context bootstrap. ConfigurationClassPostProcessor parses them during refresh.',
    answer60s:
      '@Import on @Configuration adds classes to ConfigurationClassParser. Plain classes: recursive parse. ImportSelector: immediate selectImports(). DeferredImportSelector: deferred until all configs scanned — Boot auto-config ordering. ImportBeanDefinitionRegistrar: programmatic BeanDefinitionRegistry API. Foundation of Spring Boot auto-configuration.',
    answer3m:
      'ConfigurationClassParser.processImports handles three extension types plus regular @Configuration. ImportSelector — synchronous, Environment-aware selections. DeferredImportSelector — Group interface in Boot sorts auto-configurations, processes after user beans defined so @ConditionalOnBean works. ImportBeanDefinitionRegistrar — lowest-level, register custom BeanDefinitions (e.g. AOP infrastructure). Boot 3: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports replaces spring.factories EnableAutoConfiguration. Tables compare the three. Production: prefer declarative @Import of explicit @Configuration; use Registrar only for framework-style extension.',
    memory: '@IMPORT → ConfigurationClassParser → Selector / Deferred / Registrar.',
    tables: [
      {
        headers: ['Extension', 'When runs', 'Returns / action', 'Typical use'],
        rows: [
          ['@Import(Config.class)', 'Immediately during parse', 'Recursively parse @Configuration', 'Modular config classes'],
          ['ImportSelector', 'During processImports', 'String[] of class names to import', 'Feature toggles, Environment branches'],
          ['DeferredImportSelector', 'After all @Configuration parsed', 'String[] class names (ordered groups in Boot)', 'Auto-configuration, @ConditionalOnBean'],
          ['ImportBeanDefinitionRegistrar', 'During processImports', 'registerBeanDefinitions(registry, metadata)', 'Low-level BeanDefinition API'],
        ],
      },
      {
        headers: ['API method', 'Interface', 'Boot example'],
        rows: [
          ['selectImports(AnnotationMetadata)', 'ImportSelector / DeferredImportSelector', 'AutoConfigurationImportSelector'],
          ['registerBeanDefinitions(Registry, Metadata)', 'ImportBeanDefinitionRegistrar', 'AopConfigUtils, custom starters'],
          ['getImportGroup()', 'DeferredImportSelector.Group (nested)', 'AutoConfigurationGroup sorting'],
        ],
      },
    ],
  },
  {
    id: 'import-resource',
    annotation: '@ImportResource',
    family: 'config',
    what:
      '@Target(TYPE) loads legacy Spring XML bean definitions from classpath locations (locations or value attribute) or inline XML (String[] resources). Processed alongside annotation config during context refresh. Supports optional reader context (BeanDefinitionReader) for Groovy DSL in older stacks.',
    why:
      'Migrate legacy XML applications incrementally to Java config. Import shared XML libraries in hybrid apps. Most greenfield Boot 3 apps omit it entirely — prefer Java @Configuration and auto-config.',
    example: `@Configuration
@ImportResource("classpath:legacy-beans.xml")
public class HybridConfig {}

// legacy-beans.xml
// <beans>
//   <bean id="legacyParser" class="com.example.LegacyParser"/>
// </beans>`,
    processor:
      'ConfigurationClassParser.processImports treats @ImportResource like resource-based bean definition loading. Delegates to BeanDefinitionReader (XmlBeanDefinitionReader) to parse XML into BeanDefinitionRegistry. Same registry as @Bean and component-scan — names must not collide unless override allowed.',
    when:
      'Brownfield integration of XML-defined beans. Rare in new Boot 3 services — use @Bean or starter auto-config instead.',
    flow: `1. ConfigurationClassPostProcessor parses @Configuration
2. @ImportResource locations resolved via ResourceLoader
3. XmlBeanDefinitionReader.loadBeanDefinitions(Resource)
4. XML <bean> entries → GenericBeanDefinition in registry
5. Annotation-defined and XML-defined beans coexist
6. AutowiredAnnotationBeanPostProcessor injects across both sources`,
    lifecycle:
      'XML beans same lifecycle as annotation beans once registered — singleton default in XML unless scope="prototype".',
    proxy:
      'XML AOP config (<aop:config>) may create proxies independently of annotation @EnableAspectJAutoProxy — avoid duplicate AOP setups.',
    runtime:
      'XML and Java beans indistinguishable at runtime — unified BeanFactory. getBean works for both.',
    failure:
      'BeanDefinitionStoreException — invalid XML, missing class. Duplicate bean id with @Bean. Namespace handlers missing for custom schemas. ClassNotFound in XML class attribute.',
    debug:
      'Enable DEBUG on org.springframework.beans.factory.xml.XmlBeanDefinitionReader. Validate XML in CI. List all bean names at startup.',
    production:
      'Plan migration path from XML to @Configuration. Set spring.main.allow-bean-definition-overriding=false to catch conflicts. Do not mix XML and Java definitions for same bean name.',
    mistakes: [
      'Duplicate bean names between XML and @Bean',
      'Importing large XML sets slowing startup unnecessarily',
      'Assuming XML beans skip injection — they participate fully in DI',
      'Using @ImportResource in Boot without understanding override rules',
      'Leaving deprecated XML after partial migration',
    ],
    traps: [
      'XML default autowire="default" — no injection unless explicit constructor-arg',
      'Interview: @ImportResource still supported in Framework 6 but uncommon in Boot 3',
      'classpath*: multiple jars — duplicate id collisions',
      'XML prototype in singleton — same scope trap as annotation config',
    ],
    answer15s:
      '@ImportResource loads XML bean definitions into the same BeanDefinitionRegistry as Java config. XmlBeanDefinitionReader parses classpath XML during context refresh.',
    answer60s:
      '@ImportResource on @Configuration imports Spring XML bean files. ConfigurationClassParser triggers XmlBeanDefinitionReader; resulting BeanDefinitions merge with @Component and @Bean registrations. Hybrid migration pattern for legacy apps. Boot 3 greenfield rarely needs it.',
    answer3m:
      'Hybrid configuration: Java @Configuration + XML legacy. Parser loads resources, reader registers beans. Cross-wiring: @Autowired XML bean into @Component works. Pitfalls: duplicate names, XML without autowire, AOP duplication. Migration: move high-churn beans to @Bean first. spring.main.allow-bean-definition-overriding. Contrast @Import which imports Java @Configuration classes.',
    memory: '@IMPORT_RESOURCE = XML → XmlBeanDefinitionReader → same registry.',
  },
  {
    id: 'import-selector',
    annotation: 'ImportSelector',
    family: 'config',
    what:
      'Functional interface: String[] selectImports(AnnotationMetadata importingClassMetadata). Invoked by ConfigurationClassParser when a class @Import`s an ImportSelector implementation. Returns fully qualified configuration class names to register. Can implement EnvironmentAware, BeanFactoryAware, ResourceLoaderAware for context.',
    why:
      'Dynamic selection of which @Configuration classes to load based on annotations on the importing class, system properties, or Environment — without classpath scanning. Used by @Enable* annotations across Spring modules.',
    example: `public class EnableKafkaImportSelector implements ImportSelector {
  @Override
  public String[] selectImports(AnnotationMetadata metadata) {
    return new String[] {
      KafkaAnnotationDrivenConfiguration.class.getName(),
      KafkaBootstrapConfiguration.class.getName()
    };
  }
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(EnableKafkaImportSelector.class)
public @interface EnableKafka {}`,
    processor:
      'ConfigurationClassParser.processImports → invoke ImportSelector.selectImports immediately (not deferred). Returned classes enqueued for recursive ConfigurationClass parsing. Selector itself is instantiated via ReflectionUtils — must have no-arg constructor.',
    when:
      'Building @EnableXxx annotations. Conditional config class selection at parse time. Prefer DeferredImportSelector if you need other @Configuration beans to exist first.',
    flow: `1. User @Configuration @Import(MySelector.class)
2. Parser instantiates MySelector
3. selectImports(importingClassMetadata) called
4. Returns ["com.example.KafkaConfig", "com.example.KafkaConsumerConfig"]
5. Parser processes each as @Configuration import
6. Continues standard @Bean / @ComponentScan parsing`,
    lifecycle:
      'Selector invoked once per context refresh during configuration parsing. Not a bean unless also registered separately.',
    proxy:
      'N/A — selector is a bootstrap helper, not typically a managed bean.',
    runtime:
      'No runtime artifact — only affects which configuration classes were parsed at startup.',
    failure:
      'ClassNotFoundException for returned FQCN. Empty array imports nothing — may be intentional. Selector throwing exception aborts context refresh.',
    debug:
      'Log returned arrays from custom selectors. Unit-test selectImports with AnnotationMetadata test doubles.',
    production:
      'Keep selectImports deterministic and fast. Document returned classes. Use Environment for profiles, not runtime business state.',
    mistakes: [
      'Using ImportSelector when DeferredImportSelector is needed for ordering',
      'Returning non-configuration classes without @Bean methods',
      'Heavy classpath scanning inside selectImports',
      'Throwing for missing optional feature instead of returning empty array',
    ],
    traps: [
      'ImportSelector runs before DeferredImportSelector — cannot see beans registered by deferred configs',
      'Selector not a Spring bean — @Autowired fields not injected unless Aware callbacks used',
      'Return value must be String class names, not @Configuration class objects (API is String[])',
    ],
    answer15s:
      'ImportSelector.selectImports returns configuration class names to import during parsing — immediate, not deferred.',
    answer60s:
      'ImportSelector is called synchronously during ConfigurationClassParser.processImports. Returns FQCN strings of classes to parse as configuration. Powers @Enable* annotations. Use EnvironmentAware for profile-based imports. Contrast DeferredImportSelector for auto-config ordering after user configs.',
    answer3m:
      'Mechanics: @Import(Selector.class) → instantiate → selectImports(metadata) → recursive parse. Metadata exposes annotations on importing class for attribute-driven choices. Examples: @EnableTransactionManagement, custom @EnableKafka. Aware interfaces for Environment. Not a bean — avoid dependency injection except via Aware. vs DeferredImportSelector: immediate vs end-of-scan. vs ImportBeanDefinitionRegistrar: class names vs direct registry manipulation. Testing: DefaultAnnotationMetadata or spring-test metadata builders.',
    memory: 'IMPORT_SELECTOR = immediate selectImports → parse listed configs.',
    tables: [
      {
        headers: ['Aspect', 'ImportSelector', 'DeferredImportSelector'],
        rows: [
          ['Timing', 'During processImports', 'After all @Configuration classes parsed'],
          ['Boot auto-config', 'Rare directly', 'AutoConfigurationImportSelector'],
          ['@ConditionalOnBean safe?', 'No — bean may not exist yet', 'Yes — user beans usually registered'],
          ['API', 'selectImports', 'selectImports + optional Group'],
        ],
      },
    ],
  },
  {
    id: 'deferred-import-selector',
    annotation: 'DeferredImportSelector',
    family: 'config',
    what:
      'Subinterface of ImportSelector processed in a later phase by ConfigurationClassPostProcessor — after all regular @Configuration classes have been parsed. Spring Boot AutoConfigurationImportSelector is the canonical implementation, loading META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.',
    why:
      'Auto-configuration must run after user-defined @Configuration so @ConditionalOnMissingBean and @ConditionalOnBean evaluate correctly. Enables sorting auto-configurations via AutoConfigurationGroup (before/after ordering).',
    example: `// Simplified Boot pattern — framework code (Boot 3)
// AutoConfigurationImportSelector already implements DeferredImportSelector
public class AutoConfigurationImportSelector implements DeferredImportSelector {
  @Override
  public String[] selectImports(AnnotationMetadata metadata) {
    return AutoConfigurationEntry.getImports(metadata); // reads META-INF/...AutoConfiguration.imports
  }
}

@AutoConfiguration
@ConditionalOnClass(KafkaTemplate.class)
@ConditionalOnMissingBean(KafkaTemplate.class)
public class KafkaAutoConfiguration {
  @Bean KafkaTemplate<?, ?> kafkaTemplate() { ... }
}`,
    processor:
      'ConfigurationClassParser collects DeferredImportSelector instances in deferredImportSelectors list. After processConfigBeanDefinitions parses all user configurations, ConfigurationClassPostProcessor invokes DeferredImportSelector.process → selectImports → import auto-configuration classes. Boot 3: AutoConfigurationImportSelector reads .imports files; AutoConfigurationGroup sorts with @AutoConfigureBefore/After.',
    when:
      'Framework and Boot extension authors only — application code rarely implements this directly. Use @ImportAutoConfiguration or spring Boot starters instead.',
    flow: `1. Parse @SpringBootApplication → @EnableAutoConfiguration → DeferredImportSelector
2. Parse all user @Configuration classes first
3. Run DeferredImportSelector.selectImports
4. Load candidate auto-config class names from META-INF imports
5. Apply @ConditionalOnClass, OnBean, OnProperty filters
6. Sort remaining configs (AutoConfigurationGroup)
7. Parse and register @Bean methods from auto-config classes`,
    lifecycle:
      'Single deferred pass per context refresh. Condition evaluation uses BeanDefinitionRegistry state, not always fully instantiated beans.',
    proxy:
      'Auto-config @Configuration often uses proxyBeanMethods=false for startup speed.',
    runtime:
      'Determines which auto-configured beans exist — no runtime selector object.',
    failure:
      'Auto-config not applied — @ConditionalOnMissingBean matched existing bean. Wrong ordering — bean depends on not-yet-processed auto-config. Missing imports file in custom starter.',
    debug:
      'Boot: --debug or logging.level.org.springframework.boot.autoconfigure=DEBUG for condition report. ConditionEvaluationReport bean in context.',
    production:
      'Custom starters: register via META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports. Use @AutoConfigureAfter(DataSourceAutoConfiguration.class). Never implement DeferredImportSelector in app code without strong reason.',
    mistakes: [
      'Implementing DeferredImportSelector in application instead of using @ImportAutoConfiguration',
      'Wrong @AutoConfigureOrder — datasource after JPA',
      'Missing @ConditionalOnClass for optional dependencies',
      'Fat auto-config without conditions — slows every app',
    ],
    traps: [
      'Interview: DeferredImportSelector exists so @ConditionalOnMissingBean works',
      'Boot 3 uses .imports file not spring.factories for auto-config',
      'User @Configuration parsed before auto-config — can define bean that blocks auto-config',
      'process never called for ImportSelector — only Deferred gets delayed',
    ],
    answer15s:
      'DeferredImportSelector delays selectImports until all user @Configuration is parsed — Boot uses it for auto-configuration and @ConditionalOnBean.',
    answer60s:
      'DeferredImportSelector extends ImportSelector but ConfigurationClassPostProcessor invokes it after scanning user configs. Boot AutoConfigurationImportSelector loads auto-config classes from META-INF imports, filters with @Conditional*, sorts with AutoConfigurationGroup. Ensures user @Bean overrides auto-config via @ConditionalOnMissingBean.',
    answer3m:
      'Why deferred: if auto-config ran first, @ConditionalOnMissingBean could not see user beans. Flow: collect deferred selectors during parse → finish user configurations → process deferred → import auto-config chain. Boot 3: AutoConfiguration.imports, ConditionEvaluationReport. @AutoConfigureBefore/After/Order control graph. Custom starter checklist: auto-config class, imports file, conditions, metadata. Contrast immediate ImportSelector. Application devs use @SpringBootApplication not custom DeferredImportSelector.',
    memory: 'DEFERRED = auto-config AFTER user config → @ConditionalOnMissingBean works.',
    tables: [
      {
        headers: ['Phase', 'What completes', 'DeferredImportSelector action'],
        rows: [
          ['1 — User config parse', 'All @Configuration, @ComponentScan, @Import (non-deferred)', 'Collected, not yet executed'],
          ['2 — Deferred process', 'User BeanDefinitions visible in registry', 'selectImports → auto-config class names'],
          ['3 — Auto-config parse', 'Conditional evaluation', 'Register remaining @Beans'],
          ['4 — BFPP / instantiate', 'BeanFactoryPostProcessors, bean creation', 'N/A'],
        ],
      },
    ],
  },
  {
    id: 'import-bean-definition-registrar',
    annotation: 'ImportBeanDefinitionRegistrar',
    family: 'config',
    what:
      'Interface with void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry). @Import`d to programmatically register BeanDefinitions without @Configuration or XML — lowest-level Spring context extension point.',
    why:
      'Register infrastructure beans with precise control (bean name, factory, depends-on) when @Bean methods are awkward. Used internally by @EnableAspectJAutoProxy, @EnableTransactionManagement, Spring Data, etc.',
    example: `public class HttpClientRegistrar implements ImportBeanDefinitionRegistrar {
  @Override
  public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    RootBeanDefinition def = new RootBeanDefinition(HttpClient.class);
    def.setInstanceSupplier(() -> HttpClient.newBuilder().build());
    registry.registerBeanDefinition("httpClient", def);
  }
}

@Configuration
@Import(HttpClientRegistrar.class)
public class ClientConfig {}`,
    processor:
      'ConfigurationClassParser.processImports detects ImportBeanDefinitionRegistrar assignable type, instantiates, calls registerBeanDefinitions immediately with importing class AnnotationMetadata and the BeanDefinitionRegistry. Bypasses @Configuration class parsing for those beans.',
    when:
      'Framework-style extensions, registering multiple related definitions, conditional registration at BeanDefinition level. Application code rarely needs this — prefer @Bean.',
    flow: `1. @Import(HttpClientRegistrar.class) on @Configuration
2. Parser instantiates registrar
3. registerBeanDefinitions(metadata, registry)
4. registry.registerBeanDefinition(...) one or more times
5. Beans later instantiated like any RootBeanDefinition
6. @Conditional on registrar itself not automatic — handle in code or wrap with @Import selector`,
    lifecycle:
      'Registrar runs at parse time once. Registered beans follow normal instantiation lifecycle.',
    proxy:
      'Registrar may register BeanDefinitions with factory methods or instance suppliers; AOP applied later if advisors match.',
    runtime:
      'Registrar object discarded after registration unless also defined as a bean.',
    failure:
      'Duplicate bean name in registry. Invalid bean class. Registrar not public/no-arg ctor. Logic error registering beans that fail @Conditional expectations.',
    debug:
      'Log registry.registerBeanDefinition calls. Compare bean count before/after custom registrar in tests.',
    production:
      'Avoid in business apps — use @Bean for clarity. If building a starter, pair with @Import on auto-configuration and document bean names.',
    mistakes: [
      'Registering beans that should honor @ConditionalOnMissingBean without checking registry',
      'Hard-coded bean names colliding with Boot defaults',
      'Using registrar for simple single beans — @Bean is clearer',
      'Not making registrar class public',
    ],
    traps: [
      'Registrar runs during parse — some Environment properties available, not all beans',
      'Lower level than @Bean — no @Configuration proxy singleton semantics for factory',
      'Interview triad: ImportSelector (class names) vs Registrar (direct definitions) vs @Import(Config)',
      'InstanceSupplier (Java 8+) for programmatic construction without factory method',
    ],
    answer15s:
      'ImportBeanDefinitionRegistrar programmatically registers BeanDefinitions during @Import parsing — lowest-level hook, used by framework @Enable* support.',
    answer60s:
      'ImportBeanDefinitionRegistrar.registerBeanDefinitions writes directly to BeanDefinitionRegistry when @Import`d. No @Configuration wrapper required. Framework uses it for AOP, transaction, Data infrastructure. Application code should prefer @Bean unless building a starter.',
    answer3m:
      'Parser processImports branch: if ImportBeanDefinitionRegistrar, instantiate and call registerBeanDefinitions(metadata, registry). Full control: RootBeanDefinition, scopes, depends-on, InstanceSupplier. Contrast ImportSelector returns class names for further parsing. Contrast @Bean: declarative on @Configuration method. Examples in framework: AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary. Testing: GenericApplicationContext and assert registry.containsBeanDefinition. Production: starter authors only; stable bean names; check registry for conflicts.',
    memory: 'REGISTRAR = direct BeanDefinitionRegistry API at parse time.',
    tables: [
      {
        headers: ['Mechanism', 'Registers via', 'Best for'],
        rows: [
          ['@Bean method', 'ConfigurationClassBeanDefinitionReader', 'Application beans'],
          ['@Import(Config.class)', 'Recursive configuration parse', 'Modular @Configuration'],
          ['ImportSelector', 'FQCN list → parse', '@Enable* config class lists'],
          ['DeferredImportSelector', 'Deferred FQCN list', 'Boot auto-config'],
          ['ImportBeanDefinitionRegistrar', 'registry.registerBeanDefinition', 'Framework infrastructure'],
        ],
      },
    ],
  },
];
