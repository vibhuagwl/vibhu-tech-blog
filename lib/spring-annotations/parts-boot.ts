import type {AnnotationCard} from './types';

export const BOOT: AnnotationCard[] = [
  {
    id: 'spring-boot-application',
    annotation: '@SpringBootApplication',
    family: 'boot',
    what:
      '@Target(TYPE) composed meta-annotation on the main class: @SpringBootConfiguration (alias for @Configuration), @EnableAutoConfiguration, and @ComponentScan on the declaring package (and sub-packages). In Spring Boot 3 it is the single entry point that triggers component scanning, auto-configuration import, and property binding for a standalone application. Uses jakarta.* namespace throughout the stack.',
    why:
      'One annotation replaces three boilerplate declarations and encodes Boot conventions: scan from the application root package, pull in auto-config from classpath, and treat the main class as a @Configuration source. exclude/excludeName on @SpringBootApplication disables specific auto-config classes without turning off the whole mechanism.',
    example: `@SpringBootApplication(
    exclude = {DataSourceAutoConfiguration.class},
    scanBasePackages = "com.acme.payments"
)
public class PaymentsApplication {
  public static void main(String[] args) {
    SpringApplication.run(PaymentsApplication.class, args);
  }
}`,
    processor:
      'SpringApplication.run → SpringApplication.prepareContext → AnnotationConfigServletWebServerApplicationContext (typical web). @SpringBootConfiguration triggers ConfigurationClassPostProcessor like @Configuration. @ComponentScan registers BeanDefinitions via ClassPathBeanDefinitionScanner. @EnableAutoConfiguration registers AutoConfigurationImportSelector via @Import. Main class itself becomes a configuration bean (often unused except for extra @Bean methods).',
    when:
      'Every Boot 3 executable application main class. Use scanBasePackages when domain code lives outside the main class package. Use exclude when a starter is on classpath but must not activate (e.g. no DB in a batch worker).',
    flow: `SpringApplication.run pipeline (Boot 3):
1. Create SpringApplication — deduce web type, load ApplicationContextInitializer listeners
2. prepareEnvironment — application.properties/yml, profiles, @ConfigurationProperties binding prep
3. createApplicationContext — AnnotationConfigServletWebServerApplicationContext (or reactive/non-web)
4. prepareContext — apply initializers, print banner
5. refresh(context):
   a. ConfigurationClassPostProcessor parses @SpringBootApplication metadata
   b. Component scan → register @Component/@Service/@Repository beans
   c. @EnableAutoConfiguration → AutoConfigurationImportSelector → META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   d. Condition evaluation filters auto-config classes
   e. finishBeanFactoryInitialization → create singletons
6. callRunners — ApplicationRunner / CommandLineRunner`,
    lifecycle:
      'Main @SpringBootApplication class is registered as a singleton configuration bean at context refresh. It is not special at runtime beyond scan roots and auto-config enablement — business beans follow normal singleton/prototype lifecycle.',
    proxy:
      '@SpringBootApplication inherits @Configuration proxyBeanMethods=true default — @Bean methods on main class are CGLIB-proxied for singleton inter-calls. Auto-configured beans may be JDK or CGLIB proxies when AOP applies (@Transactional, @Cacheable).',
    runtime:
      'At runtime the annotation metadata is consumed; behavior is the refreshed ApplicationContext with scanned beans + conditionally loaded auto-config. spring.autoconfigure.exclude property mirrors exclude attribute.',
    failure:
      'BeanDefinitionOverrideException — duplicate bean from scan + auto-config. Component scan misses beans outside base package. exclude typo leaves unwanted auto-config active. Non-static nested main class fails context bootstrap.',
    debug:
      'DEBUG org.springframework.boot.autoconfigure — condition outcomes. --debug flag prints ConditionEvaluationReport. logging.level.org.springframework.context.annotation=DEBUG for scan boundaries. Verify scanBasePackages covers your @Service packages.',
    production:
      'Keep main class in root package (com.acme.app) so default scan covers modules. Explicit scanBasePackages for multi-module monoliths. Document exclude list — prefer @ConditionalOnProperty over hard exclude when feature-flagging infra. Never put business logic in main class.',
    mistakes: [
      'Placing @SpringBootApplication in a sub-package — sibling packages not scanned',
      'Using @SpringBootApplication on library @Configuration instead of @AutoConfiguration',
      'Disabling all auto-config instead of targeted exclude',
      'Expecting javax.servlet APIs on Boot 3 — must use jakarta.servlet',
      'Multiple @SpringBootApplication classes in one JVM without test slice isolation',
    ],
    traps: [
      'Interview: @SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan',
      'scanBasePackageClasses alternative to string packages — type-safe scan anchor',
      'SpringBootTest uses @SpringBootConfiguration from test slice, not always full application class',
      'Boot 3: spring.main.allow-bean-definition-overriding default false — user @Bean wins over auto-config only with @ConditionalOnMissingBean pattern',
    ],
    answer15s:
      '@SpringBootApplication combines @Configuration, @EnableAutoConfiguration, and @ComponentScan on the main class package. SpringApplication.run refreshes the context, scanning components and importing Boot auto-config via AutoConfiguration.imports (Boot 3).',
    answer60s:
      '@SpringBootApplication is the Boot entry meta-annotation: @SpringBootConfiguration enables @Bean parsing, @ComponentScan registers stereotypes from the application package, @EnableAutoConfiguration imports AutoConfiguration classes filtered by @Conditional. SpringApplication.run builds the environment, creates the web/non-web ApplicationContext, refreshes it, then runs CommandLineRunners. exclude removes specific auto-config classes. Boot 3 uses jakarta.* and AutoConfiguration.imports instead of spring.factories.',
    answer3m:
      'Walk SpringApplication.run: environment with profiles and property sources → context type deduction (SERVLET/REACTIVE/NONE) → refresh. ConfigurationClassPostProcessor handles @SpringBootApplication: scan registers BeanDefinitions; @Import(AutoConfigurationImportSelector) loads candidate auto-config from META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, each evaluated by OnClass/OnProperty/OnMissingBean conditions. User beans from scan merge with auto-config beans; @ConditionalOnMissingBean prevents duplicate DataSource etc. Main class is a @Configuration bean — avoid @Bean clutter. Boot 2 used spring.factories EnableAutoConfiguration key; Boot 3 split imports file. jakarta.servlet replaces javax.servlet. Debug: --debug, ConditionEvaluationReport. Production: root package convention, explicit scan for multi-module, targeted excludes.',
    memory: 'SPRING BOOT APP = @Configuration + @EnableAutoConfiguration + @ComponentScan(root pkg).',
    tables: [
      {
        headers: ['Meta-annotation', 'Role', 'Boot 3 note'],
        rows: [
          ['@SpringBootConfiguration', '@Configuration alias', 'Marks config source'],
          ['@EnableAutoConfiguration', 'Import auto-config', 'AutoConfiguration.imports file'],
          ['@ComponentScan', 'Classpath scan', 'Default = main class package'],
        ],
      },
    ],
  },
  {
    id: 'enable-auto-configuration',
    annotation: '@EnableAutoConfiguration',
    family: 'boot',
    what:
      '@Target(TYPE) @Import(AutoConfigurationImportSelector.class) enables Spring Boot auto-configuration. AutoConfigurationImportSelector implements DeferredImportSelector — auto-config classes are imported after user @Configuration classes so user beans and @ConditionalOnMissingBean guards take precedence. Each entry is a @Configuration class (often @AutoConfiguration in Boot 2.7+/3) guarded by @Conditional annotations.',
    why:
      'Convention-over-configuration: classpath presence of JDBC driver, spring-kafka, spring-webmvc triggers sensible defaults without manual @Bean wiring. Deferred import ordering ensures user configuration wins and conditions can inspect already-registered BeanDefinitions.',
    example: `@Configuration
@EnableAutoConfiguration
public class LegacyStyleConfig {
  // rare outside @SpringBootApplication — prefer composition on main class
}

// Typical: only on main class via @SpringBootApplication
// Disable: spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration`,
    processor:
      'AutoConfigurationImportSelector (ImportSelector + DeferredImportSelector): getAutoConfigurationEntry reads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (Boot 3) via SpringFactoriesLoader pattern replacement. Filters exclusions from @EnableAutoConfiguration exclude attributes and spring.autoconfigure.exclude property. AutoConfigurationImportFilter implementations (OnClassCondition etc.) remove non-matching classes BEFORE definitions registered. Remaining classes sorted by @AutoConfigureOrder, @AutoConfigureBefore, @AutoConfigureAfter via AutoConfigurationSorter. Each class processed by ConfigurationClassPostProcessor like user @Configuration.',
    when:
      'Always on via @SpringBootApplication. Standalone @EnableAutoConfiguration only for non-Boot Spring apps embedding Boot auto-config (unusual). Use exclude/excludeName when a starter should not configure beans.',
    flow: `AutoConfigurationImportSelector pipeline (Boot 3):
┌─────────────────────────────────────────────────────────────┐
│ 1. ConfigurationClassParser reaches @EnableAutoConfiguration│
│ 2. DeferredImportSelector — deferred until user configs done │
│ 3. AutoConfigurationImportSelector.getAutoConfigurationEntry │
│    a. load FactoryNames from AutoConfiguration.imports      │
│    b. remove exclusions (annotation + property)             │
│    c. invoke AutoConfigurationImportFilter (OnClassCondition) │
│    d. sort with AutoConfigurationSorter (Before/After/Order)│
│ 4. @Import each surviving @AutoConfiguration class          │
│ 5. ConfigurationClassPostProcessor parses @Bean + @Conditional│
│ 6. ConditionEvaluationReport records match/non-match        │
│ 7. BeanFactoryPostProcessors run — bean definitions final   │
│ 8. Singleton instantiation — @ConditionalOnMissingBean sees user beans│
└─────────────────────────────────────────────────────────────┘`,
    lifecycle:
      'Auto-config @Bean methods run during singleton creation phase like any @Configuration — lazy beans deferred until first injection. Auto-configuration classes themselves are configuration beans; rarely injected directly.',
    proxy:
      'Auto-config @Configuration often uses proxyBeanMethods=false for startup speed. Returned beans (@Transactional services) may still be proxied by AOP infrastructure independent of auto-config class proxy setting.',
    runtime:
      'After refresh, active auto-config leaves concrete beans (DataSource, KafkaTemplate, SecurityFilterChain). Inactive configs leave no beans — only trace in ConditionEvaluationReport when debug enabled.',
    failure:
      'Auto-config circular dependency — rare, often user @Bean conflict. Wrong classpath → expected auto-config skipped (OnClassCondition). Multiple DataSource without @Primary — user removed @ConditionalOnMissingBean guard by defining partial bean.',
    debug:
      'java -jar app.jar --debug prints ConditionEvaluationReport. logging.level.org.springframework.boot.autoconfigure=DEBUG. spring.boot.autoconfigure.logging.condition-evaluation-report=always (Boot 2.7+). Inspect AutoConfiguration.imports in dependency JARs.',
    production:
      'Trust @ConditionalOnMissingBean in custom starters. Order custom @AutoConfiguration with @AutoConfigureAfter(DataSourceAutoConfiguration.class). Do not copy-paste auto-config @Bean into app — upgrade breaks. Feature flags via @ConditionalOnProperty.',
    mistakes: [
      'Defining @Bean of same type without @Primary when auto-config also defines one',
      'Assuming auto-config runs before component scan — scan and user @Configuration register first, import is deferred',
      'Copying Boot internal @Configuration classes into app code',
      'Looking for spring.factories on Boot 3 only — file moved to AutoConfiguration.imports',
    ],
    traps: [
      'DeferredImportSelector: user @Configuration processed BEFORE auto-config import decision',
      'AutoConfigurationImportFilter pre-filters BEFORE BeanDefinition registration — cheap classpath checks',
      'exclude on @SpringBootApplication is NOT the same as @Profile — exclude is unconditional removal from candidate list',
      'Test slices (@WebMvcTest) import subset — not full AutoConfigurationImportSelector list',
    ],
    answer15s:
      '@EnableAutoConfiguration imports AutoConfigurationImportSelector, which loads auto-config class names from AutoConfiguration.imports, filters by conditions and exclusions, sorts by Before/After, and registers @Bean definitions deferred after user configuration.',
    answer60s:
      'AutoConfigurationImportSelector is a DeferredImportSelector registered by @EnableAutoConfiguration. It reads META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, applies exclusions, runs AutoConfigurationImportFilter (OnClassCondition) for early rejection, sorts via AutoConfigurationSorter, and @Imports each @AutoConfiguration class. Conditions evaluated at registration and again at bean creation for @ConditionalOnBean. User @Configuration from component scan is processed first so @ConditionalOnMissingBean works.',
    answer3m:
      'Full pipeline: @EnableAutoConfiguration → @Import AutoConfigurationImportSelector → getAutoConfigurationEntry → load candidates from AutoConfiguration.imports (Boot 3; Boot 2 used META-INF/spring.factories EnableAutoConfiguration key) → subtract exclude lists → AutoConfigurationImportFilter (OnClassCondition reads class names only, no class loading for optional deps) → AutoConfigurationSorter honors @AutoConfigureBefore/@AutoConfigureAfter/@AutoConfigureOrder → import configurations → ConfigurationClassPostProcessor registers @Bean methods → ConditionEvaluationReport aggregates outcomes (enable --debug). Deferred import critical: user beans registered first. @AutoConfiguration replaces @Configuration on Boot auto-config classes. jakarta namespace: servlet, persistence, validation auto-config targets jakarta.* APIs. Production: custom starters use same imports file + conditions; never fight auto-config with duplicate beans.',
    memory: 'ENABLE AUTO-CONFIG → DeferredImportSelector → imports file → filter → sort → @Conditional.',
  },
  {
    id: 'conditional',
    annotation: '@Conditional',
    family: 'boot',
    what:
      '@Target(TYPE|METHOD) Spring Framework annotation specifying one or more Condition implementations. Condition.matches(ConditionContext, AnnotatedTypeMetadata) returns true to register the bean or @Configuration, false to skip silently. Spring Boot meta-conditions (@ConditionalOnClass, @ConditionalOnProperty, etc.) are composed @Conditional annotations with built-in Condition classes.',
    why:
      'Declarative feature toggles and classpath-safe optional integrations. Keeps BeanDefinition registry clean — no failed bean creation for missing optional dependencies. Boot auto-config is entirely condition-driven.',
    example: `@Configuration
@ConditionalOnProperty(name = "features.audit", havingValue = "true")
public class AuditConfig {

  @Bean
  @Conditional(OnProductionEnvironmentCondition.class)
  public AuditPublisher auditPublisher() {
    return new KafkaAuditPublisher();
  }
}`,
    processor:
      'ConfigurationClassParser / ConfigurationClassBeanDefinitionReader attach ConditionEvaluator to BeanDefinition or @Configuration class. ConfigurationCondition (Boot) can implement ConfigurationPhase.PARSE_CONFIGURATION vs REGISTER_BEAN for early vs late evaluation. ConditionEvaluationReport logs each condition class, outcome, and message. Multiple @Conditional annotations on same element use AND semantics (all must match).',
    when:
      'Custom feature flags, environment-specific beans, library modules that must not load without dependencies. Prefer Boot composed conditions over raw @Conditional unless custom logic needed.',
    flow: `Condition evaluation timing:
PARSE_CONFIGURATION phase (e.g. @ConditionalOnClass on @Configuration):
  → evaluated when configuration class parsed
  → entire @Configuration skipped if false

REGISTER_BEAN phase (e.g. @ConditionalOnBean on @Bean method):
  → evaluated when bean definition registered
  → can inspect existing BeanDefinitions in registry

Runtime re-check: some conditions re-evaluated at bean instantiation`,
    lifecycle:
      'False condition → BeanDefinition never registered → bean does not exist in context. True at parse time but false later → BeanCreationException possible for @ConditionalOnBean edge cases during refresh ordering.',
    proxy:
      'No proxy involvement — conditions gate registration only. Advised beans behind conditions follow normal AOP proxy rules once created.',
    runtime:
      'ConditionContext provides BeanDefinitionRegistry, Environment, ResourceLoader, ClassLoader. AnnotatedTypeMetadata exposes annotation attributes for condition logic.',
    failure:
      'Bean not found because condition false — silent without debug. Custom Condition throwing exception aborts context refresh. @ConditionalOnClass with wrong classloader misses classpath resource in fat JAR.',
    debug:
      'ConditionEvaluationReport — --debug or logging.condition-evaluation-report=always. Each report entry: condition class, matched/unmatched, message. Custom Condition: log in matches() at TRACE.',
    production:
      'Use Boot meta-conditions for consistency. Document property keys toggling features. Custom conditions must be fast — run at scale during every context refresh in tests.',
    mistakes: [
      'Using @Profile instead of @ConditionalOnProperty for feature flags tied to properties',
      'Expecting @ConditionalOnBean to see beans not yet registered at parse phase',
      'Throwing from Condition.matches instead of returning false',
      'AND vs OR confusion — use @ConditionalOnAnyNestedCondition or @AnyNestedCondition for OR',
    ],
    traps: [
      'Interview: @ConditionalOnXxx are meta-@Conditional — same evaluator pipeline',
      'ConfigurationPhase.PARSE_CONFIGURATION vs REGISTER_BEAN — order matters for OnBean vs OnClass',
      'Negative conditions (@ConditionalOnMissingBean) evaluated against current registry snapshot',
      'Test @MockBean can satisfy @ConditionalOnBean unexpectedly',
    ],
    answer15s:
      '@Conditional registers beans only when Condition.matches returns true. Boot wraps it in @ConditionalOnClass, @ConditionalOnProperty, etc. ConditionEvaluationReport records outcomes at startup.',
    answer60s:
      '@Conditional attaches Condition implementations to @Configuration or @Bean. ConditionEvaluator calls matches(ConditionContext, AnnotatedTypeMetadata). Boot conditions implement ConfigurationCondition with parse vs register phases. Multiple conditions AND together. Auto-configuration relies on this to skip JDBC, Kafka, or web stacks when classpath or properties absent.',
    answer3m:
      'Framework: Condition interface, ConditionEvaluator, ConditionContext (registry + environment). Boot meta-annotations bundle condition classes with attribute mapping. Phases: PARSE_CONFIGURATION skips whole config class early (OnClass); REGISTER_BEAN inspects registry (OnBean, OnMissingBean). Report: ConditionEvaluationReport auto-configured by Boot, printed with --debug. Contrast @Profile: profile is a special Environment property check, activeProfiles in tests. Custom conditions for multi-tenant routing. Pitfalls: phase mismatch, silent skip, fat-jar ClassLoader. Combine with @AutoConfigureAfter so conditions see expected beans.',
    memory: 'CONDITIONAL = matches() gates BeanDefinition; Boot On* are composed @Conditional.',
  },
  {
    id: 'conditional-on-class',
    annotation: '@ConditionalOnClass',
    family: 'boot',
    what:
      '@Conditional(OnClassCondition.class) — registers the annotated @Configuration or @Bean only if specified classes are present on the classpath (and loadable). Uses @ConditionalOnClass(name="...") string form to avoid NoClassDefFoundError when optional dependency absent. OnClassCondition implements AutoConfigurationImportFilter for pre-registration filtering of auto-config classes.',
    why:
      'Safe optional starters: Kafka auto-config loads only if org.apache.kafka.clients.producer.KafkaProducer exists. String name attribute prevents JVM from loading missing classes during annotation parsing of your code.',
    example: `@AutoConfiguration
@ConditionalOnClass(KafkaTemplate.class)
@ConditionalOnClass(name = "org.apache.kafka.clients.producer.KafkaProducer")
public class KafkaAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public KafkaTemplate<?, ?> kafkaTemplate(ProducerFactory<?, ?> pf) {
    return new KafkaTemplate<>(pf);
  }
}`,
    processor:
      'OnClassCondition: uses FilteringClassLoader / ClassUtils.isPresent with application ClassLoader. As AutoConfigurationImportFilter, filters auto-config candidates in AutoConfigurationImportSelector BEFORE @Import. As ConfigurationCondition (PARSE_CONFIGURATION), skips @Configuration class. name attribute preferred over class reference in user libraries referencing optional deps.',
    when:
      'Auto-configuration modules, optional integrations, fat JAR with varying classpath. Always use name="fully.qualified.Class" in library code that compiles without optional dependency.',
    flow: `OnClassCondition dual role:
AutoConfigurationImportFilter (import time):
  candidates → filter where required classes missing → shortened import list

@Configuration @ConditionalOnClass (parse time):
  ConfigurationClassParser → OnClassCondition.matches
  → false: skip entire configuration class metadata`,
    lifecycle:
      'If class absent at startup, configuration never enters registry — no bean lifecycle. Adding dependency to classpath on redeploy activates on next restart (not hot reload of conditions).',
    proxy:
      'N/A — registration gate only.',
    runtime:
      'Class presence checked via ClassLoader.getResource or ClassUtils.isPresent — does not instantiate the class.',
    failure:
      'Typo in name string — config silently skipped. Using .class reference in library without compile dependency — compilation failure. Wrong ClassLoader in custom OSGi/plugin — false negative.',
    debug:
      'ConditionEvaluationReport: "OnClassCondition did not find required class ...". Verify dependency scope in Maven (compile vs optional). mvn dependency:tree for missing transitive.',
    production:
      'String name form in shared libraries. Document required starter for feature. Pair with @ConditionalOnProperty for kill switch.',
    mistakes: [
      'ConditionalOnClass(MyOptional.class) in module that does not depend on MyOptional — compile error',
      'Checking interface when only impl on classpath — check concrete class used by auto-config',
      'Expecting runtime addition of JAR without restart',
    ],
    traps: [
      'OnClassCondition as ImportFilter avoids loading broken auto-config classes — performance win',
      'value= and name= are aliases for class name strings in Boot conditions',
      'Interview: string form avoids classloading side effects',
      'Boot 3 jakarta: check jakarta.servlet.Servlet not javax.servlet',
    ],
    answer15s:
      '@ConditionalOnClass activates configuration only if classes are on the classpath. Use name="..." to avoid compile-time dependency. OnClassCondition also pre-filters auto-config imports.',
    answer60s:
      'OnClassCondition checks ClassUtils.isPresent for listed classes. On auto-config entries it acts as AutoConfigurationImportFilter before BeanDefinition registration. On @Configuration it runs at PARSE_CONFIGURATION. Prefer name attribute over class literals in optional modules. Typical pattern: @ConditionalOnClass + @ConditionalOnMissingBean in Boot starters.',
    answer3m:
      'Mechanism: FilteringClassLoader, no static init of checked class. Dual path in AutoConfigurationImportSelector — filter list early, then per-class parse condition. Contrast @ConditionalOnMissingClass for negative guard. Boot 3 jakarta migration: auto-config conditions reference jakarta.persistence.EntityManager not javax.persistence. Debug silent skip via report. Production: starter POM brings classpath; condition gates config. Common bug: provided scope dependency present at compile but absent at runtime in WAR.',
    memory: 'ON CLASS = classpath present? Use name="..." for optional deps.',
  },
  {
    id: 'conditional-on-missing-bean',
    annotation: '@ConditionalOnMissingBean',
    family: 'boot',
    what:
      '@Conditional(OnBeanCondition.class) negative variant — registers bean/@Configuration only when no matching bean definition already exists. Supports type, name, annotation, ignored types, search strategy (all ancestors vs current context only). Cornerstone of Boot auto-config: provide default DataSource unless user defined one.',
    why:
      'User override without @Primary fights — first real bean wins, auto-config backs off. Enables drop-in replacement: define your own ObjectMapper bean, Jackson auto-config skips defaults.',
    example: `@AutoConfiguration
@ConditionalOnClass(DataSource.class)
public class DataSourceAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public DataSource dataSource(DataSourceProperties props) {
    return DataSourceBuilder.create().build();
  }
}

// User wins:
@Configuration
public class AppDataSource {
  @Bean
  public DataSource dataSource() { return new HikariDataSource(...); }
}`,
    processor:
      'OnBeanCondition at REGISTER_BEAN phase — inspects ConfigurableListableBeanFactory.getBeanNamesForType and considers @Bean method return types, factory beans, parameterized types. @ConditionalOnMissingBean on auto-config evaluated AFTER user @Configuration from component scan (DeferredImportSelector ordering). search=SearchStrategy.CURRENT vs ALL — parent context awareness in MVC tests.',
    when:
      'Every Boot auto-config default bean. Custom starter libraries offering defaults. Testing: @MockBean replaces bean — subsequent @ConditionalOnMissingBean sees mock.',
    flow: `Override timeline:
T0: User @Configuration from scan registered (DataSource @Bean)
T1: AutoConfigurationImportSelector imports DataSourceAutoConfiguration
T2: @Bean dataSource method processed — OnBeanCondition checks registry
T3: User DataSource bean exists → condition false → auto-config @Bean SKIPPED
T4: Single DataSource in context — user's`,
    lifecycle:
      'Whichever bean definition registers first while condition true gets created. Order of @Configuration processing matters for non-deferred configs; auto-config deferred specifically for this guarantee.',
    proxy:
      'Counts bean definitions, not proxy types — @Bean returning interface still blocks same-type auto-config.',
    runtime:
      'Re-evaluated at bean registration time. Parameterized types: MissingBean on RedisTemplate<String,Object> may not see RedisTemplate<Object,Object> depending on attributes.',
    failure:
      'Two beans — user partial config + auto-config both active because types differ slightly (DataSource vs HikariDataSource). @MockBean in test prevents real bean but changes production wiring if misplaced.',
    debug:
      'Report: "OnBeanCondition @ConditionalOnMissingBean found existing bean". Bean names: getBeanNamesForType(DataSource.class). Check @MockBean in @SpringBootTest.',
    production:
      'Define full replacement @Bean, not partial. Use @Primary only when keeping both beans intentional. Library: always @ConditionalOnMissingBean on defaults.',
    mistakes: [
      'Defining @Bean of subtype — auto-config parent type bean still created',
      'Two auto-config modules both using @ConditionalOnMissingBean — race if neither user bean',
      '@MockBean causing missing production bean in integration test false positive',
      'Expecting @ConditionalOnMissingBean on @Configuration class to see beans from same class @Bean methods early',
    ],
    traps: [
      'DeferredImportSelector ordering is WHY this works — interview favorite',
      'ignored= types excluded from match (e.g. ignore abstract parents)',
      'name= attribute checks specific bean name not just type',
      '@ConditionalOnSingleCandidate complements when exactly one candidate needed',
    ],
    answer15s:
      '@ConditionalOnMissingBean registers a bean only if no existing bean of that type/name is already defined. Boot auto-config defaults use it so user @Bean overrides without conflict.',
    answer60s:
      'OnBeanCondition at REGISTER_BEAN phase queries the registry. Auto-configuration imports deferred until user configurations register, so user DataSource @Bean prevents Boot default. Supports type, name, annotation filters. Pair with @ConditionalOnClass. Debug via ConditionEvaluationReport when bean unexpectedly missing — often condition matched existing @MockBean or duplicate type.',
    answer3m:
      'Deep: SearchStrategy.CURRENT vs ALL for parent/child contexts. Parameterized generic matching rules. @Bean in same @Configuration class — registration order within class; @ConditionalOnMissingBean on second @Bean may see first if processed sequentially. User override patterns: full @Bean replacement, @Primary (keep both), @AutoConfigureBefore user config (anti-pattern). Test slices: @MockBean satisfies missing condition. Production pitfalls: duplicate DataSource from partial custom config + auto-config Hikari. Contrast @ConditionalOnBean positive requirement.',
    memory: 'ON MISSING BEAN = user bean wins; auto-config backs off (deferred import).',
  },
  {
    id: 'conditional-on-property',
    annotation: '@ConditionalOnProperty',
    family: 'boot',
    what:
      '@Conditional(OnPropertyCondition.class) — matches when Environment property prefix/name has expected value. Supports prefix + name array, havingValue, matchIfMissing (default false). Primary mechanism for feature flags and environment-specific toggles in Boot auto-config and application code.',
    why:
      'Externalized kill switches without recompilation: management.health.redis.enabled=false disables Redis health contributor. havingValue supports boolean, enum string, or explicit value match; missing property behavior controlled by matchIfMissing.',
    example: `@Configuration
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true", matchIfMissing = false)
public class KafkaConsumersConfig {

  @Bean
  public NewTopic paymentEventsTopic(KafkaAdmin admin) {
    return TopicBuilder.name("payments.events").partitions(6).build();
  }
}

# application.yml
app:
  kafka:
    enabled: true`,
    processor:
      'OnPropertyCondition reads Environment.getProperty(prefix + name) with relaxed binding (kebab-case, env vars APP_KAFKA_ENABLED). Multiple names OR semantics within name array. havingValue empty → property merely exists (non-null). Evaluated at PARSE_CONFIGURATION for class-level, REGISTER_BEAN for method-level.',
    when:
      'Feature flags, optional subsystems, environment profiles complement (prod vs local). Prefer over @Profile when toggle is property-centric not whole profile switch.',
    flow: `Property resolution:
app.kafka.enabled in YAML
  → relaxed binding: APP_KAFKA_ENABLED env var
  → OnPropertyCondition: havingValue "true" (case-sensitive unless relaxed)
  → matchIfMissing=false and property absent → NO MATCH`,
    lifecycle:
      'Changing property requires restart (or Spring Cloud refresh scope / @RefreshScope beans for dynamic subset). Condition not re-evaluated on property change for standard singleton beans.',
    proxy:
      'N/A.',
    runtime:
      'Uses Environment abstraction — works with application.properties, YAML, env vars, command line args, ConfigData API (Boot 2.4+).',
    failure:
      'Relaxed binding mismatch — havingValue="true" but property Boolean true unquoted. Typo in prefix. matchIfMissing=true enables feature when property absent — surprise in prod.',
    debug:
      'Report shows property name evaluated and value found. logging.level.org.springframework.boot.autoconfigure.condition=DEBUG. Actuator /env endpoint.',
    production:
      'Explicit havingValue for booleans. Document defaults in README. Use metadata in spring-configuration-metadata.json for IDE hints. Dangerous matchIfMissing=true on security features.',
    mistakes: [
      'havingValue case sensitivity with YES vs yes',
      'Using @Profile for single property instead of @ConditionalOnProperty',
      'matchIfMissing=true on payment or security integration',
      'prefix without trailing dot conflation — prefix="app.kafka" name="enabled" → app.kafka.enabled',
    ],
    traps: [
      'List binding: name="features" havingValue maps to comma list semantics — read Boot docs',
      '@ConfigurationProperties bean may exist even when @ConditionalOnProperty false on related @Configuration — separate concerns',
      'Kubernetes env var APP_KAFKA_ENABLED maps to app.kafka.enabled',
    ],
    answer15s:
      '@ConditionalOnProperty enables beans when an Environment property matches havingValue. Supports prefix, matchIfMissing, and relaxed binding for env vars.',
    answer60s:
      'OnPropertyCondition checks Environment properties with relaxed binding. Class or method registration gated on match. Auto-config uses it for spring.kafka.*, management.* toggles. matchIfMissing controls behavior when property absent. Prefer explicit havingValue="true" for flags.',
    answer3m:
      'Binding: YAML → ConfigData → Environment. Multiple names on one annotation OR logic. Contrast @Profile(activeProfiles="kafka") — activates all beans in profile block vs surgical property gate. Cloud: @RefreshScope + /actuator/refresh for dynamic beans — not automatic for static @Conditional. Production: feature flags in ConfigMap; fail closed on security. Debug ConditionEvaluationReport property lines. Common: redis.enabled, spring.batch.job.enabled. vs @Value injection on bean — property can exist while condition false on different @Configuration.',
    memory: 'ON PROPERTY = Environment key match; relaxed binding APP_FOO_BAR.',
  },
  {
    id: 'conditional-on-web-application',
    annotation: '@ConditionalOnWebApplication',
    family: 'boot',
    what:
      '@Conditional(OnWebApplicationCondition.class) — matches when application is a web application (SERVLET, REACTIVE, or ANY). Spring Boot deduces web type from classpath (spring-mvc vs webflux) and SpringApplication.setWebApplicationType. Gates DispatcherServlet auto-config, error MVC, web-specific health.',
    why:
      'CLI/batch workers should not load servlet container beans. Single codebase JAR can run as web or non-web via classpath and spring.main.web-application-type property.',
    example: `@AutoConfiguration
@ConditionalOnWebApplication(type = Type.SERVLET)
public class DispatcherServletAutoConfiguration {
  // registers DispatcherServlet, WebMvcAutoConfiguration chain
}

# application.properties for batch-only process:
spring.main.web-application-type=none`,
    processor:
      'OnWebApplicationCondition inspects configurableWebEnvironment, existing WebServerApplicationContext, ServletContext class presence, reactive web stack. Type.SERVLET requires traditional MVC/servlet stack; REACTIVE requires WebFlux; ANY either. Interacts with SpringApplication deduced WebApplicationType.',
    when:
      'Library auto-config with web-only beans. Force non-web for Kafka consumers without embedded Tomcat. Integration tests: WebEnvironment.NONE.',
    flow: `Web type deduction (Boot 3):
Classpath has spring-webmvc + tomcat → SERVLET
Classpath has webflux + netty → REACTIVE
spring.main.web-application-type=none → not web → OnWebApplicationCondition false`,
    lifecycle:
      'Web application starts embedded server during context refresh (ServletWebServerApplicationContext). NON-WEB skips server startup — faster tests and workers.',
    proxy:
      'N/A.',
    runtime:
      'WebApplicationType set early in SpringApplication.run before context refresh. Affects which ApplicationContext implementation instantiated.',
    failure:
      'Unexpected Tomcat starts in worker — missing web-application-type=none. Web beans missing in test — @SpringBootTest webEnvironment not defined. Both MVC and WebFlux on classpath — ambiguous deduction.',
    debug:
      'Log SpringApplication deduced web application type. ConditionEvaluationReport OnWebApplication entries. Check conflicting spring-boot-starter-web and webflux.',
    production:
      'Explicit spring.main.web-application-type in worker services. Split modules: api (web) vs consumer (none). Avoid both MVC and WebFlux unless using Spring Boot composite (advanced).',
    mistakes: [
      'spring-boot-starter-web on classpath of headless consumer — pulls Tomcat',
      'Assuming @RestController prevents web — still needs web stack',
      '@SpringBootTest default MOCK web env — not full servlet container',
    ],
    traps: [
      'Type.SERVLET vs ANY — REST API still SERVLET stack unless WebFlux',
      'Boot 3 jakarta.servlet — OnWarDeploymentCondition for WAR deployment',
      'WebApplicationType.REACTIVE still "web" for @ConditionalOnWebApplication(ANY)',
    ],
    answer15s:
      '@ConditionalOnWebApplication loads config only for servlet or reactive web apps. Set spring.main.web-application-type=none for non-web workers.',
    answer60s:
      'OnWebApplicationCondition checks deduced WebApplicationType from classpath and configuration. SERVLET for MVC/Tomcat, REACTIVE for WebFlux, ANY for either. Batch and Kafka consumers typically use web-application-type=none to skip embedded server and MVC auto-config.',
    answer3m:
      'Deduction algorithm in SpringApplication: classpath hints, explicit property override. ServletWebServerApplicationContext starts Tomcat/Jetty/Undertow during refresh. Contrast @ConditionalOnNotWebApplication for CLI tools. Test: WebEnvironment.RANDOM_PORT vs NONE. Boot 3: jakarta.servlet APIs in web stack. Production split: api module with starter-web, worker with starter only (no web). Pitfall: actuator on separate port still may need web stack for servlet-based actuator.',
    memory: 'ON WEB APP = SERVLET/REACTIVE deduction; none = no Tomcat.',
  },
  {
    id: 'profile',
    annotation: '@Profile',
    family: 'boot',
    what:
      '@Target(TYPE|METHOD) Spring Framework annotation — @Configuration class or @Bean method registered only when given profile(s) active. Profiles are logical Environment labels (dev, prod, k8s) set via spring.profiles.active, @ActiveProfiles in tests, or programmatically. Composed with ! for negation (@Profile("!prod")).',
    why:
      'Environment-specific beans without separate codebases: H2 @Profile("dev"), PostgreSQL @Profile("prod"). Cleaner than sprawling @ConditionalOnProperty for whole configuration classes. Integrates with spring.config.activate.on-profile in YAML (Boot 2.4+).',
    example: `@Configuration
@Profile("prod")
public class ProdSecurityConfig {
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }
}

@Configuration
@Profile("dev")
public class DevSecurityConfig {
  @Bean
  public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance(); // dev only
  }
}`,
    processor:
      'ProfileCondition implements Condition — checks Environment.acceptsProfiles(Profiles.of(...)). ProfileAnnotatedTypeFilter during component scan can exclude @Profile beans entirely from scanning when profile inactive. @Bean @Profile processed at registration — inactive methods skipped.',
    when:
      'Whole configuration class environment splits. Test slices with @ActiveProfiles("test"). Prefer @ConditionalOnProperty for single-feature toggles within same profile.',
    flow: `Profile activation:
spring.profiles.active=prod,observability
  → Environment active profiles [prod, observability]
  → @Profile("prod") matches
  → @Profile("dev") skipped
  → @Profile("!prod") skipped`,
    lifecycle:
      'Inactive profile beans never instantiated — no half lifecycle. Switching profile requires restart unless using Spring Cloud refresh patterns.',
    proxy:
      'Inactive — no bean, no proxy.',
    runtime:
      'Profiles are part of Environment — available early. spring.profiles.group (Boot 2.4) expands profile sets.',
    failure:
      'No bean in prod — forgot @Profile on prod config or typo in spring.profiles.active. Multiple @Profile beans without @Primary — NoUniqueBeanDefinitionException when profiles overlap.',
    debug:
      'logging.level.org.springframework.core.env=DEBUG. ConditionEvaluationReport for @Profile. Print active profiles at startup in banner or Actuator /env.',
    production:
      'Explicit spring.profiles.active in each deployment manifest. Never @Profile("dev") insecure beans without !prod guard. Document required profiles. Use spring.config.import for config server not profiles alone.',
    mistakes: [
      'No default profile — only @Profile("prod") beans, dev local fails',
      'Overlapping profiles both defining same @Bean without @Primary',
      'Using profile for feature flag — use @ConditionalOnProperty instead',
      '@Profile on @SpringBootApplication main class — dangerous',
    ],
    traps: [
      'Interview: @Profile is a @Conditional(ProfileCondition)',
      '@ActiveProfiles merges with spring.profiles.active in tests',
      'Default profile: spring.profiles.default (Boot 2.4+) when none active',
      'YAML spring.config.activate.on-profile replaces document when profile active',
    ],
    answer15s:
      '@Profile registers beans only when specified profiles are active in Environment. Set spring.profiles.active=prod. Negation with @Profile("!dev").',
    answer60s:
      'ProfileCondition checks Environment.acceptsProfiles. Applied to @Configuration or @Bean for environment-specific wiring. Component scan respects inactive @Profile classes. Contrast @ConditionalOnProperty for finer toggles. Tests use @ActiveProfiles. Boot 2.4+ config file activation via spring.config.activate.on-profile.',
    answer3m:
      'Mechanism: Profiles.of parsing, multi-profile OR on single @Profile annotation value array. Profile groups in application.yml. Production: prod/staging/dev separation; secrets per profile. Pitfalls: missing default bean when no profile active; accidental dev security in prod via profile misconfiguration. vs @ConditionalOnCloudPlatform for K8s/AWS. Integration testing: @SpringBootTest @ActiveProfiles("integration"). Profile on auto-config rare — prefer conditions.',
    memory: 'PROFILE = Environment activeProfiles gate; ! negates.',
  },
  {
    id: 'auto-configure-ordering',
    annotation: '@AutoConfigureBefore / @After / @Order',
    family: 'boot',
    what:
      '@AutoConfigureBefore and @AutoConfigureAfter on @AutoConfiguration classes declare ordering relative to other auto-configuration classes. @AutoConfigureOrder (lowest precedence value wins earlier) sets coarse ordering. AutoConfigurationSorter builds directed graph; cycles fail fast at startup. Not general @DependsOn — only among auto-config classes.',
    why:
      'SecurityFilterChain must exist before resource server config. Kafka consumer factory before listener container. User custom @AutoConfiguration must run after DataSourceAutoConfiguration to inject DataSource.',
    example: `@AutoConfiguration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
@AutoConfigureBefore(KafkaAutoConfiguration.class)
public class OutboxAutoConfiguration {

  @Bean
  @ConditionalOnBean(DataSource.class)
  public OutboxPublisher outboxPublisher(DataSource ds) {
    return new JdbcOutboxPublisher(ds);
  }
}`,
    processor:
      'AutoConfigurationSorter in AutoConfigurationImportSelector.getAutoConfigurationEntry sorts filtered candidates before @Import. Reads @AutoConfigureBefore/After class references. @AutoConfigureOrder on class — default order 0, security often negative for earlier. Does NOT order user @Configuration — only auto-config entries in imports file.',
    when:
      'Writing custom spring-boot-starter auto-config. Fixing bean creation order between two Boot auto-config modules. Not for ordering regular application @Beans — use @DependsOn instead.',
    flow: `Sort example:
A: @AutoConfigureAfter(B)
B: @AutoConfigureBefore(A)
  → valid DAG → B imported before A

SecurityAutoConfiguration @AutoConfigureOrder(-100)
  → early in chain`,
    lifecycle:
      'Ordering affects BeanDefinition registration order among auto-config classes — influences @ConditionalOnBean visibility between auto-config modules.',
    proxy:
      'N/A.',
    runtime:
      'Sort computed once per application context refresh at auto-config import time.',
    failure:
      'AutoConfigure cycle detected — startup failure with cycle message. Expected bean missing — your @AutoConfiguration before DataSource but @ConditionalOnBean DataSource. Wrong class reference — orders relative to config not bean.',
    debug:
      'DEBUG AutoConfigurationSorter — final import order list. Compare with --debug condition report order.',
    production:
      'Minimal ordering — rely on @ConditionalOnBean. Document starter ordering in README. @AutoConfigureAfter for JDBC-dependent features.',
    mistakes: [
      'Using @AutoConfigureBefore on user @Configuration — ignored',
      'Expecting order between user @Bean and auto-config via these annotations',
      'Circular @AutoConfigureBefore/After between custom starters',
    ],
    traps: [
      'User @Configuration always processed before auto-config import — separate from AutoConfigure* ordering',
      '@Order on regular @Configuration is NOT AutoConfigureOrder',
      'Interview: sorter only among AutoConfiguration.imports entries',
    ],
    answer15s:
      '@AutoConfigureBefore/@After order auto-configuration classes during import. AutoConfigurationSorter builds the graph. Use @DependsOn for regular bean creation order.',
    answer60s:
      'After AutoConfigurationImportFilter, AutoConfigurationSorter topologically sorts auto-config classes using Before/After/Order metadata. Ensures DataSource before JdbcTemplate auto-config. Custom starters should @AutoConfigureAfter built-in configs they depend on. Does not affect user component scan order.',
    answer3m:
      'Algorithm: directed edges from Before/After annotations → topological sort → stable order. @AutoConfigureOrder default 0; lower runs earlier. Cycle detection fails startup. Contrast @DependsOn (bean level), @Order on @Bean (limited). Deferred import: user configs first, then sorted auto-config list. Production: outbox, Flyway after DataSource. Debug import order in logs. Pitfall: @ConditionalOnBean not satisfied because auto-config ordered wrong — fix with @AutoConfigureAfter.',
    memory: 'AUTO CONFIGURE BEFORE/AFTER = sort auto-config imports only.',
  },
  {
    id: 'condition-evaluation-report',
    annotation: 'ConditionEvaluationReport',
    family: 'boot',
    what:
      'Not an annotation — Boot diagnostic bean aggregating outcomes of all Condition evaluations during auto-configuration (and optionally custom @Conditional). Printed to log at INFO when --debug or logging.level org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLogger=DEBUG. Shows positive matches, negative matches, exclusions, and unconditional classes.',
    why:
      'Answers "why didn\'t DataSource auto-configure?" without debugger. Essential for interview debugging scenarios and production startup forensics when bean missing.',
    example: `# Enable at startup
java -jar app.jar --debug

# Or application.properties
debug=true
logging.level.org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLogger=DEBUG

# Sample output section:
# Positive matches:
#   DataSourceAutoConfiguration matched:
#     - @ConditionalOnClass found jdbc (OnClassCondition)
# Negative matches:
#   RedisAutoConfiguration did not match:
#     - @ConditionalOnClass did not find redis.clients.jedis.Jedis`,
    processor:
      'ConditionEvaluationReport singleton collected by ConditionEvaluationReportListener and Boot auto-config condition classes calling recordEvaluation. AutoConfigurationReportLoggingInitializer registers logger. Spring Boot Actuator beans endpoint shows bean graph; report is startup-only text.',
    when:
      'Missing expected auto-config bean, unexpected beans loaded, local dev troubleshooting, writing custom conditions.',
    flow: `Report generation:
Each Condition.matches → record match/unmatch with message
  → aggregated in ConditionEvaluationReport
  → after context refresh → log report if debug enabled
  → sections: exclusions, unconditional, positive, negative`,
    lifecycle:
      'Generated once per ApplicationContext refresh. Test contexts each produce separate report.',
    proxy:
      'N/A.',
    runtime:
      'In-memory during refresh; not exposed via Actuator by default (use /beans or /conditions in Boot 2.2+ actuator if enabled).',
    failure:
      'Report too large — dozens of starters. Misread negative match as error — negative is normal for unused stacks.',
    debug:
      'It IS the debug tool. Also: spring-boot-autoconfigure jar ConditionEvaluationReport.get(context) programmatically in tests.',
    production:
      'Enable briefly during staging deploy issues — not permanent DEBUG in prod (noise, PII in property values). Run with --debug in CI smoke for regression on expected auto-config.',
    mistakes: [
      'Ignoring negative matches — they explain skipped configs',
      'Assuming positive match means bean exists — @ConditionalOnMissingBean may still skip @Bean',
      'Looking for report without enabling debug',
    ],
    traps: [
      'Interview: tie report to AutoConfigurationImportSelector pipeline',
      'Report shows condition class simple name and detail message',
      '@ConditionalOnMissingBean negative message shows which existing bean blocked',
    ],
    answer15s:
      'ConditionEvaluationReport logs which auto-configurations matched or failed and why. Enable with --debug or debug=true.',
    answer60s:
      'Boot collects every Condition outcome during refresh into ConditionEvaluationReport. Sections list exclusions, positive matches (activated), and negative matches (skipped) with condition messages like OnClassCondition class not found. Primary tool for diagnosing missing DataSource or Kafka beans.',
    answer3m:
      'Pipeline tie-in: after AutoConfigurationImportSelector imports and conditions run, report reflects full picture including unconditional auto-config classes. Access via SpringApplicationRunListeners. Test: ApplicationContextRunner.withUserConfiguration().run(ctx -> report = ConditionEvaluationReport.get(ctx)). Production: enable on failing pod startup, grep Negative matches for Redis/Kafka. Contrast spring-boot-actuator /conditions endpoint runtime view. Custom Condition should provide clear matches() message for report readability.',
    memory: 'CONDITION REPORT = --debug → why auto-config in/out.',
  },
  {
    id: 'boot2-vs-boot3-discovery',
    annotation: 'Boot 2 vs Boot 3 auto-config discovery',
    family: 'boot',
    what:
      'Spring Boot 2.x loads auto-configuration class names from META-INF/spring.factories under EnableAutoConfiguration key via SpringFactoriesLoader. Spring Boot 3.x moves entries to META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports (one FQCN per line) and migrates javax.* to jakarta.* (Servlet, JPA, Validation, Annotation). Module boundaries: spring-boot-autoconfigure still hosts conditions; native compilation hints differ.',
    why:
      'Faster startup — imports file avoids parsing unrelated spring.factories keys. Clearer authoring for custom starters. Jakarta EE 9+ baseline for Spring Framework 6.',
    example: `# Boot 3 — META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.starter.FooAutoConfiguration
com.example.starter.BarAutoConfiguration

# Boot 2 — META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\\
com.example.starter.FooAutoConfiguration,\\
com.example.starter.BarAutoConfiguration

# jakarta migration example
// Boot 2: javax.servlet.http.HttpServlet
// Boot 3: jakarta.servlet.http.HttpServlet`,
    processor:
      'Boot 3 AutoConfigurationPackages.Registrar unchanged conceptually. AutoConfigurationImportSelector.getCandidateConfigurations uses imports file loader. spring.factories still used for ApplicationContextInitializer, EnvironmentPostProcessor, FailureAnalyzer — NOT auto-config list. Spring Boot 3 requires Java 17+. Dependency management imports jakarta BOM.',
    when:
      'Migrating libraries to Boot 3, authoring new starters, debugging "auto-config not loading" after upgrade.',
    flow: `Migration checklist:
1. Replace javax.* imports → jakarta.* in code
2. Rename spring.factories EnableAutoConfiguration → AutoConfiguration.imports
3. Update third-party starters to Boot 3 variants
4. Run --debug → ConditionEvaluationReport
5. Fix WebSecurityConfigurerAdapter removal etc.`,
    lifecycle:
      'Discovery at every cold start. Fat JAR nested jars each contribute imports file — merged by loader.',
    proxy:
      'N/A.',
    runtime:
      'Hybrid Boot 2.7 supported spring.factories AND imports file as transition; Boot 3 only imports file for auto-config.',
    failure:
      'Starter still on Boot 2 spring.factories only — auto-config never loads on Boot 3. javax/jakarta mismatch — compile error or NoClassDefFoundError at runtime.',
    debug:
      'jar tf starter.jar | grep AutoConfiguration.imports. Compare with old spring.factories. dependency-tree for javax.persistence leftovers.',
    production:
      'Pin Boot 3 compatible starter versions. Internal starters publish imports file. CI enforces no javax.servlet in classpath.',
    mistakes: [
      'Only updating application code, not internal starter metadata',
      'Mixing Boot 2 and Boot 3 starters',
      'Forgetting hibernate-validator jakarta artifact',
    ],
    traps: [
      'Interview: spring.factories still exists for other extension points',
      'AutoConfiguration.imports is NOT spring.factories format — plain lines',
      'Boot 2.7 backported imports file support',
      'jakarta.annotation.Resource still in jakarta.annotation package',
    ],
    answer15s:
      'Boot 3 uses META-INF/spring/...AutoConfiguration.imports instead of spring.factories for auto-config, and jakarta.* instead of javax.*.',
    answer60s:
      'AutoConfigurationImportSelector in Boot 3 reads AutoConfiguration.imports one class per line. Boot 2 used comma-separated EnableAutoConfiguration in spring.factories. Jakarta migration affects servlet, JPA, validation, inject annotations. Custom starters must ship imports file for Boot 3.',
    answer3m:
      'Historical: SpringFactoriesLoader scanned all keys — slower. Boot 3 split concerns. Migration tooling: spring-boot-properties-migrator dependency. javax.annotation.PostConstruct → jakarta.annotation.PostConstruct. Web: Spring MVC uses jakarta.servlet. JPA: jakarta.persistence.Entity. Conditions in Boot 3 reference jakarta classes in @ConditionalOnClass. Production rollout: upgrade parent POM, run integration tests with --debug report, verify each starter JAR contains imports file. Pitfall: Tomcat embed jakarta servlet API. Native image: different reachability metadata — out of scope but discovery same.',
    memory: 'BOOT 3 = AutoConfiguration.imports + jakarta; Boot 2 = spring.factories.',
    tables: [
      {
        headers: ['Aspect', 'Boot 2.x', 'Boot 3.x'],
        rows: [
          ['Auto-config registry', 'META-INF/spring.factories', 'META-INF/spring/...AutoConfiguration.imports'],
          ['Servlet API', 'javax.servlet', 'jakarta.servlet'],
          ['JPA', 'javax.persistence', 'jakarta.persistence'],
          ['Java baseline', '8+ (2.7: 17 optional)', '17+'],
          ['Spring Framework', '5.x', '6.x'],
        ],
      },
    ],
  },
  {
    id: 'enable-overview',
    annotation: '@Enable* overview',
    family: 'boot',
    what:
      'Family of composable @EnableXxx annotations importing registrar/delegate via @Import: @EnableScheduling, @EnableAsync, @EnableCaching, @EnableTransactionManagement, @EnableWebMvc, @EnableMethodSecurity, @EnableKafka, @EnableJpaRepositories, etc. Each toggles a Spring module by registering infrastructure BeanDefinitions (post-processors, advisors, listeners) — parallel to @EnableAutoConfiguration but explicit and user-opt-in.',
    why:
      'Explicit feature activation without classpath guessing. Auto-config may enable some automatically, but @Enable* gives control in non-Boot or when excluding auto-config. Documents architectural choice in @Configuration class.',
    example: `@Configuration
@EnableScheduling
@EnableAsync
@EnableCaching
@EnableTransactionManagement
public class InfrastructureConfig {

  @Bean
  public TaskExecutor taskExecutor() {
    return new ThreadPoolTaskExecutor();
  }
}

// Boot often auto-enables via auto-config — e.g. @EnableAutoConfiguration imports transaction management when jdbc on classpath`,
    processor:
      'Pattern: @Import(Selector or Registrar). Examples: @EnableAsync → @Import(AsyncConfigurationSelector) registers proxy post-processors; @EnableScheduling → SchedulingConfiguration; @EnableKafka → KafkaListenerAnnotationBeanPostProcessor; @EnableTransactionManagement → @Import(AutoProxyRegistrar) + TransactionManagementConfigurationSelector. Mode attributes (proxyTargetClass, order) affect CGLIB vs JDK and advisor order.',
    when:
      'Non-Boot Spring apps. Boot when auto-config excluded but feature still needed. Fine-grained: @EnableMethodSecurity(prePostEnabled=true) on security config.',
    flow: `@Enable* common pattern:
@EnableX
  → @Import(XConfigurationSelector)
  → registers BeanPostProcessors / advisors / @Scheduled annotation processing
  → cooperates with @Scheduled, @Async, @Cacheable, @Transactional on beans`,
    lifecycle:
      'Infrastructure beans from @Enable* created during context refresh before most user beans — enables annotation processing on user beans at instantiate time.',
    proxy:
      '@EnableAsync / @EnableCaching / @EnableTransactionManagement trigger AOP infrastructure — JDK or CGLIB per proxyTargetClass and bean type.',
    runtime:
      'Boot may duplicate some @Enable* via auto-config — avoid double @EnableTransactionManagement unless understanding advisor ordering.',
    failure:
      'Double @Enable* with conflicting proxyTargetClass. @EnableAsync without TaskExecutor bean — SimpleAsyncTaskExecutor fallback. @EnableKafka without kafka on classpath — failure at consumer startup.',
    debug:
      'Check ConfigurationClassParser @Import graph. Advisor count in debugger. Boot auto-config report for TransactionAutoConfiguration.',
    production:
      'Prefer Boot auto-config defaults; explicit @Enable* when trimming auto-config. Document which @Enable* main application uses. @EnableMethodSecurity for Spring Security 6.',
    mistakes: [
      'Manual @EnableWebMvc disabling Boot MVC auto-config defaults',
      '@EnableAsync on main class but @Async methods in beans not scanned',
      'Duplicate @EnableTransactionManagement in library and app',
    ],
    traps: [
      '@EnableAutoConfiguration ≠ @Enable* family — auto-config is Boot-specific convention',
      'Spring Boot @SpringBootApplication does NOT include @EnableScheduling — add explicitly',
      '@EnableTransactionManagement mode=ASPECTJ requires AspectJ weaving',
      'Boot 3 @EnableMethodSecurity replaces @EnableGlobalMethodSecurity',
    ],
    answer15s:
      '@Enable* annotations @Import infrastructure configuration for scheduling, async, caching, transactions, Kafka, etc. Boot auto-config may enable equivalents when starters present.',
    answer60s:
      'Each @EnableX uses @Import to register module infrastructure: post-processors, advisors, listeners. Examples: @EnableScheduling activates @Scheduled processing; @EnableAsync enables @Async proxying; @EnableTransactionManagement registers transaction advisor; @EnableKafka adds @KafkaListener processor. Contrast @EnableAutoConfiguration which imports classpath-based Boot auto-config classes.',
    answer3m:
      'Map: Scheduling → ScheduledAnnotationBeanPostProcessor; Async → AsyncAnnotationBeanPostProcessor + executor beans; Caching → CacheInterceptor; Transaction → TransactionInterceptor via TransactionManagementConfigurationSelector; Kafka → KafkaListenerAnnotationBeanPostProcessor; JPA → JpaRepositoriesRegistrar. Boot overlap: TransactionAutoConfiguration equivalent to @EnableTransactionManagement when jdbc present. Production: explicit @EnableScheduling on @Configuration in apps using @Scheduled; security @EnableMethodSecurity jsr250/prePost flags. Pitfalls: @EnableWebMvc full control vs Boot relaxed defaults; double enable advisor order conflicts. jakarta: @EnableJpaRepositories uses jakarta.persistence.',
    memory: '@ENABLE* = @Import module infra; not the same as EnableAutoConfiguration.',
    tables: [
      {
        headers: ['@Enable*', 'Activates', 'Typical paired annotation'],
        rows: [
          ['@EnableScheduling', '@Scheduled', 'TaskScheduler bean'],
          ['@EnableAsync', '@Async', 'TaskExecutor'],
          ['@EnableCaching', '@Cacheable', 'CacheManager'],
          ['@EnableTransactionManagement', '@Transactional', 'PlatformTransactionManager'],
          ['@EnableKafka', '@KafkaListener', 'ConsumerFactory'],
          ['@EnableMethodSecurity', '@PreAuthorize', 'SecurityFilterChain'],
        ],
      },
    ],
  },
];
