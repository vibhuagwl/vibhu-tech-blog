import type {AnnotationCard} from './types';

export const GAPS_CORE: AnnotationCard[] = [
  {
    id: 'alias-for',
    annotation: '@AliasFor',
    family: 'gaps-core',
    what:
      '@Target(ANNOTATION_TYPE|METHOD|FIELD) meta-annotation declaring that one annotation attribute is an alias for another attribute on a related annotation. Spring Framework 6 uses @AliasFor heavily in composed annotations: @GetMapping aliases path/value to @RequestMapping, @SpringBootApplication aliases exclude to @EnableAutoConfiguration.exclude. attribute and value are mutual aliases on many Spring annotations. Enables attribute override propagation when meta-annotations are stacked.',
    why:
      'Composed annotations must forward user-specified attributes to the underlying meta-annotation without duplicating attribute names. @AliasFor documents equivalence and powers AnnotationUtils.synthesizeAnnotation merge logic during reflection metadata reads. Without aliases, @GetMapping("/api") would not populate @RequestMapping.path.',
    example: `@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@RequestMapping(method = RequestMethod.GET)
public @interface GetApi {
  @AliasFor(annotation = RequestMapping.class, attribute = "path")
  String[] value() default {};

  @AliasFor(annotation = RequestMapping.class, attribute = "path")
  String[] path() default {};
}

// Usage: @GetApi("/health") → RequestMapping.path = {"/health"}`,
    processor:
      'No runtime BeanPostProcessor — consumed at annotation parsing time. AnnotationUtils.getAnnotationAttributes merges alias attributes when reading @RequestMapping metadata on @GetMapping. ConfigurationClassParser, RequestMappingHandlerMapping, and Condition parsers read synthesized metadata. AliasFor on @Bean name/value handled by ConfigurationClassBeanDefinitionReader.',
    when:
      'Writing custom composed annotations that wrap Spring meta-annotations. Document attribute equivalence in your own @interface. Rare in application code — common in framework and starter libraries.',
    flow: `Composed annotation resolution:
1. User annotates method @GetMapping("/orders/{id}")
2. RequestMappingHandlerMapping reads annotation metadata
3. AnnotationUtils.synthesizeAnnotation merges @GetMapping + meta @RequestMapping
4. @AliasFor maps value/path → RequestMapping.path attribute
5. RequestMappingInfo built from merged attributes
6. Same pipeline for @ConditionalOnProperty name/value aliases`,
    lifecycle:
      'Pure metadata — evaluated at startup when configuration classes and handler mappings are parsed. No per-request or per-bean lifecycle.',
    proxy:
      'N/A — annotation metadata only; does not affect proxy creation.',
    runtime:
      'After context refresh, @AliasFor has no runtime presence. Behavior encoded in merged annotation attributes on BeanDefinitions and HandlerMethod metadata.',
    failure:
      'Custom composed annotation missing @AliasFor — attribute not forwarded, mapping silent default. Circular alias definitions confuse synthesizer. Wrong annotation= in @AliasFor points to unrelated meta-annotation.',
    debug:
      'Reflect on handler method: AnnotationUtils.getAnnotationAttributes(GetMapping.class, true). Unit-test composed annotation attribute forwarding. DEBUG org.springframework.core.annotation for merge issues.',
    production:
      'When publishing internal composed annotations, always alias path/value/name pairs consistently with Spring conventions. Prefer reusing Spring composed annotations over reinventing.',
    mistakes: [
      'Defining value() without @AliasFor to @RequestMapping.path — path ignored',
      'Aliasing to wrong annotation class in annotation= attribute',
      'Expecting @AliasFor to work across unrelated annotations without meta-annotation stack',
      'Duplicate non-aliased attribute names on composed annotation',
    ],
    traps: [
      'Interview: @AliasFor enables attribute override inheritance in annotation composition',
      '@GetMapping value and path are mutual @AliasFor aliases of each other',
      'Spring Boot @ConditionalOnProperty name/value are aliases',
      'AnnotationUtils.synthesizeAnnotation is the merge engine — not Java language feature',
    ],
    answer15s:
      '@AliasFor declares two annotation attributes are equivalent, usually forwarding composed annotation attributes to a meta-annotation like @RequestMapping.path.',
    answer60s:
      '@AliasFor on annotation types documents alias relationships for Spring AnnotationUtils. When you use @GetMapping("/x"), value aliases to @RequestMapping path. Critical for composed annotations in Spring MVC, Boot conditions, and @Bean name/value. Parsed at startup — no runtime processor.',
    answer3m:
      'Meta-annotation design: @GetMapping is @RequestMapping(method=GET) with @AliasFor on value/path pointing to RequestMapping.path. Synthesis merges user attributes up the meta-annotation chain. Used in Boot (@SpringBootApplication exclude aliases), @ConditionalOnProperty, @Import annotations. Custom starters: mirror Spring patterns. Failure: silent wrong defaults when alias missing. Debug: AnnotationUtils.getAnnotationAttributes with classValuesAsString. Contrast Java @Repeatable — different concern.',
    memory: '@ALIAS_FOR = forward composed annotation attrs → meta-annotation.',
  },
  {
    id: 'order-priority',
    annotation: '@Order · @Priority',
    family: 'gaps-core',
    what:
      '@Order (org.springframework.core.annotation.Order) on class/method/parameter — Spring-specific ordering via Ordered interface / PriorityOrdered. Lower int value = higher precedence (runs earlier in sorted lists). @Priority (jakarta.annotation.Priority) — JSR-250; lower value = higher priority for @Autowired candidate resolution among equal types. Different subsystems consult different annotations: advisor chains use @Order; dependency injection tie-breaking uses @Priority among @Primary-less candidates.',
    why:
      'Multiple beans of same role need deterministic ordering: SecurityFilterChain, HandlerInterceptor, @ControllerAdvice, @Aspect advisors, ApplicationListener, SmartLifecycle. @Order on @Aspect relative to TransactionInterceptor controls whether security/audit wraps transaction boundary. @Priority breaks @Autowired ambiguity without @Primary.',
    example: `@Aspect
@Order(1) // lower = higher precedence in advisor chain
public class AuditAspect { /* ... */ }

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityConfig {
  @Bean
  @Order(2)
  public SecurityFilterChain apiChain(HttpSecurity http) { /* ... */ }
}

@Component
@Priority(1)
public class PrimaryPaymentGateway implements PaymentGateway {}

@Component
@Priority(2)
public class FallbackPaymentGateway implements PaymentGateway {}`,
    processor:
      '@Order: AnnotationAwareOrderComparator sorts beans, advisors, filters implementing Ordered or annotated @Order. AOP: advisors sorted before proxy creation — outer advisor intercepts first on inbound call. @Priority: AutowiredAnnotationBeanPostProcessor / DefaultListableBeanFactory uses PriorityAnnotationAutowireCandidateResolver when multiple autowire candidates match — lower @Priority value preferred. NOT interchangeable with @Primary.',
    when:
      '@Order: multiple @ControllerAdvice, @Aspect, SecurityFilterChain (Boot 3), FilterRegistrationBean, ApplicationRunner. @Priority: multiple implementations of same interface when exactly one should be default injection target without @Primary bean.',
    flow: `@Order advisor chain (simplified inbound):
@Order(1) AuditAspect @Around
  → @Order(2) TransactionInterceptor
    → @Order(5) Security method interceptor
      → target method

@Priority autowire:
1. resolveDependency(PaymentGateway)
2. multiple beans, no @Qualifier
3. PriorityAnnotationAutowireCandidateResolver picks lowest @Priority value
4. inject winning candidate`,
    lifecycle:
      'Order determined once at advisor/filter registration during context refresh. @Priority consulted each dependency resolution at bean creation.',
    proxy:
      '@Order on @Aspect orders advisors on shared proxy — does not create proxy itself. SecurityFilterChain order is servlet filter order, not AOP.',
    runtime:
      'Ordered.HIGHEST_PRECEDENCE = Integer.MIN_VALUE. Default @Order = Ordered.LOWEST_PRECEDENCE. @Priority default javax/jakarta default 5000 when absent.',
    failure:
      'Wrong @Order on @Aspect — transaction commits before security check. Assuming @Order on @Bean creation order — use @DependsOn for creation, @Order for runtime advisor/filter order. @Priority ignored when @Primary present.',
    debug:
      'Log advisor chain order at DEBUG org.springframework.aop. List SecurityFilterChain beans sorted by @Order. Breakpoint in resolveDependency for @Priority resolution.',
    production:
      'Document security filter @Order relative to OAuth2 resource server filters. Keep @Aspect @Order explicit when mixing @Transactional and @PreAuthorize. Prefer @Primary for single default bean; @Priority for ordered fallback chain.',
    mistakes: [
      'Confusing @Order (lower first) with @Priority on threads (higher number = higher priority in java.util.concurrent — different API)',
      'Using @Order expecting bean instantiation order',
      'Multiple @Primary with @Priority — @Primary wins',
      '@Order on @PostConstruct methods — not supported for init ordering',
    ],
    traps: [
      'Interview: @Order lower value = higher precedence in Spring Ordered comparator',
      '@Priority resolves @Autowired ambiguity — not the same as @Order on aspects',
      'SecurityFilterChain @Order(1) vs @Order(2) — first chain matched wins in Boot 3 multi-chain',
      '@DependsOn ≠ @Order — creation vs invocation ordering',
    ],
    answer15s:
      '@Order (Spring) sorts advisors, filters, listeners — lower number runs first. @Priority (jakarta) breaks @Autowired ties among same-type beans — lower value preferred.',
    answer60s:
      '@Order on @Aspect, SecurityFilterChain, @ControllerAdvice controls Ordered comparator sorting. AOP advisor with lower @Order wraps outer. @Priority on @Component helps DefaultListableBeanFactory pick autowire candidate when multiple beans match without @Qualifier/@Primary. Different annotations for different subsystems.',
    answer3m:
      'Advisor chain: AnnotationAwareAspectJAutoProxyCreator collects advisors, sorts by @Order, builds interceptor chain. TransactionInterceptor vs custom @Around — order determines commit relative to audit. Security: multiple SecurityFilterChain beans need @Order + securityMatcher. @Priority: PriorityAnnotationAutowireCandidateResolver in autowire candidate selection. Contrast @Primary (explicit default) vs @Priority (implicit preference). @AutoConfigureOrder for auto-config classes — separate from bean @Order. Pitfalls: wrong security/tx ordering, assuming @Order controls @PostConstruct sequence.',
    memory: '@ORDER = lower runs first (advisors/filters); @PRIORITY = lower wins autowire tie.',
    tables: [
      {
        headers: ['Annotation', 'Spec', 'Lower value means', 'Used for'],
        rows: [
          ['@Order', 'Spring Ordered', 'Higher precedence (earlier)', 'AOP advisors, filters, listeners'],
          ['@Priority', 'JSR-250 jakarta', 'Higher priority candidate', '@Autowired tie-break among equals'],
          ['@Primary', 'Spring', 'Explicit default bean', 'Single preferred injection target'],
          ['@DependsOn', 'Spring', 'N/A — forces creation order', 'Bean instantiation sequencing'],
        ],
      },
    ],
  },
  {
    id: 'lookup',
    annotation: '@Lookup',
    family: 'gaps-core',
    what:
      '@Target(METHOD) @Bean on abstract or concrete method in @Component/@Service class instructs Spring to override the method with CGLIB subclass implementation that calls beanFactory.getBean(returnType) on each invocation. Injects prototype or request-scoped dependency into singleton without stale reference. Alternative to ObjectProvider<T>.getObject(). Method can be abstract — subclass generated at runtime.',
    why:
      'Singleton bean cannot hold single prototype instance in field — populateBean runs once. @Lookup method override returns fresh prototype from container per call. Template method pattern: singleton orchestrator calls lookup abstract getCommand() each time.',
    example: `@Service
public abstract class OrderProcessor {

  public void process(Order order) {
    CheckoutCommand cmd = createCheckoutCommand(); // fresh prototype each call
    cmd.execute(order);
  }

  @Lookup
  protected abstract CheckoutCommand createCheckoutCommand();
}

// Concrete subclass generated by Spring with:
// protected CheckoutCommand createCheckoutCommand() {
//   return getBeanFactory().getBean(CheckoutCommand.class);
// }`,
    processor:
      'AutowiredAnnotationBeanPostProcessor / LookupOverrideAnnotationBeanPostProcessor registers LookupOverride on BeanDefinition. ClassPathScanningCandidateComponentProvider or ConfigurationClassEnhancer generates concrete subclass replacing @Lookup method body with getBean lookup. Requires non-final class (CGLIB subclass). Works on @Component stereotypes, not plain POJO.',
    when:
      'Prototype or request-scoped bean needed from singleton per operation. Prefer ObjectProvider<CheckoutCommand> injection in modern code — same semantics, no CGLIB subclass. @Lookup when template-method structure already uses abstract factory method.',
    flow: `1. Register OrderProcessor as abstract @Service bean definition
2. LookupOverride metadata attached to createCheckoutCommand method
3. CGLIB subclass OrderProcessor$$SpringCGLIB$$ created at bean instantiation
4. process() calls createCheckoutCommand()
5. Overridden method → beanFactory.getBean(CheckoutCommand.class)
6. New prototype instance returned (if prototype scope)`,
    lifecycle:
      'Singleton OrderProcessor lives entire context life. Each @Lookup invocation may create new prototype per scope rules.',
    proxy:
      'CGLIB subclass of containing bean — not JDK proxy. If @Transactional also on class, proxy layering: may be transactional proxy delegating to lookup-enabled subclass. @Lookup method must not be final/private.',
    runtime:
      'getBean uses current bean factory — respects active context, qualifiers if Lookup with @Bean name on same annotation (rare). Request scope resolves current HTTP request binding.',
    failure:
      'final class — cannot subclass for @Lookup. private @Lookup method — not overridden. Calling @Lookup method from another bean bypasses override if holding raw reference. Missing scope on returned type — still singleton if default scope.',
    debug:
      'Inspect bean class name for CGLIB subclass. Compare identityHashCode across lookup calls for prototype. Prefer ObjectProvider in unit tests.',
    production:
      'Prefer constructor-injected ObjectProvider<T> or Provider<T> over abstract @Lookup for readability. If @Lookup used, document why template method requires it.',
    mistakes: [
      'Using @Lookup on final class or final method',
      'Expecting new instance when return type bean is singleton scope',
      'Abstract @Service without component scanning picking up generated subclass',
      'Mixing field @Autowired prototype with @Lookup confusion',
    ],
    traps: [
      'Interview: @Lookup = CGLIB method override → getBean() each call',
      'ObjectProvider.getObject() is modern equivalent without abstract class',
      'Singleton injecting prototype field — WRONG; @Lookup/ObjectProvider RIGHT',
      '@Bean @Lookup on @Configuration method — different pattern (factory)',
    ],
    answer15s:
      '@Lookup overrides a method in a CGLIB subclass to call getBean(returnType) each invocation — injects prototype/request scope into singleton.',
    answer60s:
      '@Lookup on abstract/concrete method in @Component causes Spring to generate subclass replacing method with container lookup. Solves prototype-in-singleton problem. Alternative: ObjectProvider<T>. Requires non-final class. Parsed by LookupOverride metadata; invoked at runtime per call.',
    answer3m:
      'Problem: singleton created once, @Autowired prototype field fixed forever. Solutions: ObjectProvider (preferred), @Lookup (template method), scoped proxy for request/session. Mechanism: LookupOverride in BeanDefinition, CGLIB replaces method body. Contrast @Bean prototype on @Configuration — factory method scope vs injection into singleton. Production: use ObjectProvider unless legacy abstract base class. Debug: verify prototype scope on CheckoutCommand, CGLIB class name. Self-invocation on same class: internal call still hits overridden method on proxy subclass when called through proxy — but direct this.lookup() from non-lookup path may bypass if not advised.',
    memory: '@LOOKUP = CGLIB method → getBean(); fresh prototype per call.',
  },
  {
    id: 'property-source',
    annotation: '@PropertySource',
    family: 'gaps-core',
    what:
      '@Target(TYPE) on @Configuration registers additional PropertySource (Properties, YAML via factory, custom Resource) into Environment early in context refresh. Attributes: value/name (resource locations), ignoreResourceNotFound, factory (PropertySourceFactory). Boot 3 apps usually rely on application.yml ConfigData API; @PropertySource for classpath:legacy.properties or module-specific files in library @Configuration.',
    why:
      'Load non-default property files into Environment before @Value and @ConfigurationProperties binding. Library modules ship defaults in jar classpath without requiring consumer to copy into application.yml.',
    example: `@Configuration
@PropertySource(value = "classpath:payments-defaults.properties", ignoreResourceNotFound = true)
@PropertySource(
    value = "classpath:payments-\${spring.profiles.active}.properties",
    factory = EncryptedPropertySourceFactory.class)
public class PaymentsConfig {}

// EncryptedPropertySourceFactory implements PropertySourceFactory
// → decrypt values before adding to Environment`,
    processor:
      'ConfigurationClassParser processes @PropertySource during @Configuration parsing. PropertySourceProcessor (or PropertySourceAnnotationParser in older docs) reads resources via ResourceLoader, wraps as PropertySource, adds to MutablePropertySources on Environment. Order: @PropertySource typically lowest precedence unless @Order on PropertySource or spring.config.import ordering in Boot.',
    when:
      'Legacy property files, module-internal defaults, custom PropertySourceFactory (encryption, vault). Prefer Boot application.yml + spring.config.import for app-level config. @PropertySource in shared library @AutoConfiguration.',
    flow: `1. ConfigurationClassPostProcessor parses @Configuration
2. Encounter @PropertySource on PaymentsConfig
3. PropertySourceProcessor loads classpath:payments-defaults.properties
4. PropertiesPropertySource added to Environment PropertySources
5. Later @Value and Binder read merged property sources
6. Boot ConfigDataPropertySource may override if higher precedence`,
    lifecycle:
      'Property sources loaded once at context refresh during configuration parsing — before bean instantiation.',
    proxy:
      'N/A — Environment infrastructure, not bean proxy.',
    runtime:
      'Environment.getProperty resolves across ordered PropertySources. Placeholders ${spring.profiles.active} resolved when @PropertySource processed. Changes to file on disk not hot-reloaded unless Spring Cloud / devtools.',
    failure:
      'File not found without ignoreResourceNotFound=true — IllegalArgumentException. Wrong precedence — @PropertySource overridden by application.yml unexpectedly. YAML without YamlPropertySourceFactory (Boot provides DefaultPropertiesPropertySourceFactory for .properties only by default).',
    debug:
      'logging.level.org.springframework.core.env=DEBUG. Print property source order: environment.getPropertySources(). @PropertySource locations in condition report.',
    production:
      'Document precedence vs application.yml. Use ignoreResourceNotFound for optional overlays. Encrypt secrets via custom factory or external config server — not plain classpath secrets in prod.',
    mistakes: [
      'Expecting @PropertySource to override application.yml (usually opposite)',
      'Loading YAML without PropertySourceFactory',
      'Hardcoding secrets in @PropertySource classpath files committed to git',
      'Missing profile-specific file without ignoreResourceNotFound',
    ],
    traps: [
      'Interview: @PropertySource adds PropertySource to Environment at @Configuration parse time',
      'Boot 3 ConfigData loading separate from @PropertySource — know precedence',
      'Multiple @PropertySource on same class — all loaded',
      '@PropertySource on @SpringBootApplication main class works but uncommon',
    ],
    answer15s:
      '@PropertySource loads a properties/resource file into the Spring Environment during @Configuration parsing, before @Value binding.',
    answer60s:
      '@PropertySource registers additional PropertySource entries via PropertySourceProcessor. Supports ignoreResourceNotFound and custom PropertySourceFactory. Lower precedence than Boot application.yml typically. Use for library defaults or legacy files.',
    answer3m:
      'Pipeline: ConfigurationClassParser → PropertySourceProcessor → ResourceLoader → PropertySource → Environment PropertySources chain. Precedence: command line > application.properties (Boot) > @PropertySource often lower. Custom factory for encrypted properties. Contrast @ConfigurationProperties binding (type-safe prefix) vs raw properties file. Boot 3: prefer spring.config.import for optional locations. Production: never commit prod secrets; optional ignoreResourceNotFound for profile files. Debug property source order and resolved keys.',
    memory: '@PROPERTY_SOURCE = load file → Environment PropertySources (early, often low precedence).',
  },
  {
    id: 'nonnull-api',
    annotation: '@NonNullApi · @NonNullFields · @Nullable (nullability package)',
    family: 'gaps-core',
    what:
      'Spring Framework nullability annotations in org.springframework.lang package (and JSR-305 compatible tooling): @NonNullApi on package (package-info.java) declares all types/methods in package default non-null unless @Nullable on parameter/return/field. @NonNullFields marks fields non-null by default. @Nullable marks explicit nullability. Used by Spring itself and recommended for API contracts — IDE (NullAway, IntelliJ), Kotlin interop, documentation.',
    why:
      'Default non-null package contract reduces NPE in large codebases. Spring Data/JDBC uses @Nullable on return types where absent values legal. Static analysis and Kotlin platform types respect package-level @NonNullApi.',
    example: `// package-info.java
@NonNullApi
package com.acme.payments.api;

import org.springframework.lang.NonNullApi;

// PaymentService.java in same package — return implicitly @NonNull
public interface PaymentService {
  PaymentResult capture(String paymentId); // non-null contract

  @Nullable
  Payment findByExternalId(String externalId); // may return null
}`,
    processor:
      'No Spring BeanPostProcessor — compile-time / IDE contract only at runtime unless using NullAway/Checker Framework. Spring Framework uses nullability metadata in Kotlin extensions and optional validation hints. Not the same as jakarta.validation @NotNull (runtime Bean Validation).',
    when:
      'Public API packages in libraries. package-info.java @NonNullApi for service layer defaults. @Nullable on Optional-empty equivalents returning null. Pair with jakarta.validation @NotNull on REST DTOs for runtime validation — complementary concerns.',
    flow: `1. package-info.java declares @NonNullApi
2. Compiler plugins / IDE infer non-null defaults
3. @Nullable on specific methods overrides package default
4. Runtime: no automatic enforcement by Spring container
5. jakarta.validation @NotNull on controller @RequestBody enforced by Validator`,
    lifecycle:
      'Static metadata — no bean lifecycle. Runtime enforcement only if Bean Validation annotations present separately.',
    proxy:
      'N/A.',
    runtime:
      'Spring does not reject null injection based on @NonNullApi alone. NullPointerException from caller violating contract. Kotlin callers see platform types from Java @NonNullApi packages.',
    failure:
      'Assuming @NonNullApi prevents null @Autowired — container still injects null if bean missing and optional. Mixing javax.annotation.Nullable vs org.springframework.lang.Nullable — tooling confusion.',
    debug:
      'Enable NullAway in build. IDE inspection highlights violations. Distinguish from NPE at runtime in logs.',
    production:
      'Adopt @NonNullApi on api packages incrementally. Use @Nullable on boundary methods returning absent entities. Runtime validation: @NotNull on REST inputs. Document difference for team.',
    mistakes: [
      'Expecting Spring to enforce @NonNullApi at injection time',
      'Using @NonNullApi without package-info.java',
      'Confusing Spring @Nullable with lombok @NonNull',
      'Duplicate jakarta @NotNull and Spring @NonNull on same element without understanding layers',
    ],
    traps: [
      'Interview: @NonNullApi is package-default static analysis — not runtime Spring validation',
      'jakarta.validation @NotNull ≠ org.springframework.lang @NonNull',
      'Spring Framework 6 promotes org.springframework.lang over javax.annotation',
      '@Nullable on Optional return — prefer Optional over null in new APIs',
    ],
    answer15s:
      '@NonNullApi on package-info.java sets default non-null API contract for a package; @Nullable marks exceptions. Static analysis — not Spring runtime enforcement.',
    answer60s:
      'Spring nullability package (org.springframework.lang): @NonNullApi package annotation, @Nullable per-element override. Helps IDE and NullAway; Spring does not enforce at DI. Complement with jakarta.validation @NotNull for HTTP request validation.',
    answer3m:
      'Layers: (1) @NonNullApi package contract for developers; (2) Bean Validation @NotNull/@NotBlank on DTOs for runtime 400 responses; (3) Optional types instead of null returns in new code. package-info.java required. Spring Data uses @Nullable on findById-style returns. Kotlin interop. No BeanPostProcessor. Production: adopt gradually, CI NullAway. Contrast JSR-305 javax.annotation which Spring discourages for new code.',
    memory: '@NONNULL_API = package default non-null; tooling only — not DI enforcement.',
  },
  {
    id: 'managed-resource',
    annotation: '@ManagedResource (JMX overview)',
    family: 'gaps-core',
    what:
      '@Target(TYPE) JSR-77 style JMX MBean descriptor on Spring @Component — exposes bean as MBean via Spring JMX export. Attributes: objectName, description. Method-level @ManagedAttribute (readable/writable property), @ManagedOperation (callable operation), @ManagedNotification for JMX notifications. Enabled with @EnableMBeanExport or <context:mbean-export/> — Boot auto-configures MBeanServer when spring.jmx.enabled=true (default true).',
    why:
      'Operational visibility and control: expose cache stats, feature toggles, manual replay triggers through JMX consoles (VisualVM, JConsole) or monitoring platforms without custom REST admin endpoints.',
    example: `@Component
@ManagedResource(
    objectName = "com.acme:type=PaymentCache,name=stats",
    description = "Payment cache hit/miss metrics")
public class PaymentCacheMBean {

  private final AtomicLong hits = new AtomicLong();

  @ManagedAttribute(description = "Cache hit count")
  public long getHitCount() {
    return hits.get();
  }

  @ManagedOperation(description = "Clear cache")
  public void clearCache() {
    cache.invalidateAll();
  }
}`,
    processor:
      'MBeanExportConfiguration (@EnableMBeanExport) registers AnnotationMBeanExporter or AnnotationJmxAttributeSource. AnnotationMBeanExporter autodetects @ManagedResource beans, builds ModelMBean metadata from @ManagedAttribute/@ManagedOperation reflection, registers with platform MBeanServer. Boot: JmxAutoConfiguration provides MBeanServer bean if JVM supports it.',
    when:
      'Internal ops tooling, legacy JMX monitoring stacks, JVM attach diagnostics. Prefer Spring Boot Actuator metrics/health for cloud-native observability — @ManagedResource for beans already integrated with JMX or on-prem ops.',
    flow: `1. @EnableMBeanExport or Boot JmxAutoConfiguration active
2. Context refresh — detect @ManagedResource @Component beans
3. AnnotationMBeanExporter builds MBeanInfo from annotations
4. registerMBean with objectName on MBeanServer
5. Ops connects JConsole → invoke @ManagedOperation
6. @ManagedAttribute getters exposed as JMX attributes`,
    lifecycle:
      'MBean registered after bean singleton creation. Unregistered on context shutdown. Bean lifecycle normal — JMX is management facade.',
    proxy:
      'JMX invoker calls target bean method — if bean is CGLIB transactional proxy, exporter typically targets exposed object or proxy depending on configuration — verify exposeProxy settings.',
    runtime:
      'Platform MBeanServer (com.sun.management on HotSpot). Remote JMX requires JVM -Dcom.sun.management.jmxremote.* flags and network security. Boot actuator /actuator/jolokia alternative for HTTP.',
    failure:
      'ObjectName collision — InstanceAlreadyExistsException. Missing @EnableMBeanExport — bean not exported. Security: unauthenticated JMX port exposes @ManagedOperation attack surface.',
    debug:
      'VisualVM MBeans tab. logging.level.org.springframework.jmx=DEBUG. List objectNames via platform MBeanServer.queryNames.',
    production:
      'Disable remote JMX or firewall strictly. Prefer actuator over open JMX in cloud. Authenticate JMX if enabled. Do not expose destructive @ManagedOperation without auth.',
    mistakes: [
      'Exposing sensitive @ManagedOperation without security',
      'Duplicate objectName across beans',
      'Expecting @ManagedResource without MBean export enabled',
      'Heavy work in @ManagedAttribute getter called by polling monitor',
    ],
    traps: [
      'Interview: @ManagedResource + AnnotationMBeanExporter → platform MBeanServer',
      'Boot JmxAutoConfiguration vs explicit @EnableMBeanExport',
      'Actuator metrics preferred over JMX for Kubernetes',
      '@ManagedAttribute getter/setter pair for read-write attribute',
    ],
    answer15s:
      '@ManagedResource marks a Spring bean as JMX MBean; @ManagedAttribute and @ManagedOperation expose properties and operations via AnnotationMBeanExporter.',
    answer60s:
      '@ManagedResource on @Component with objectName registers MBean through Spring JMX export. @ManagedAttribute maps getters; @ManagedOperation invocable from JConsole. Boot enables JmxAutoConfiguration by default. Ops alternative: Actuator endpoints.',
    answer3m:
      'Enable: @EnableMBeanExport or Boot auto-config. AnnotationMBeanExporter introspects annotations, registers ModelMBean. Security critical for remote JMX. Contrast Micrometer metrics (@Timed) and actuator @Endpoint. Production: disable public JMX, use actuator/prometheus. Failure: objectName clash, missing export config. jakarta.management namespace. Legacy enterprise monitoring vs cloud-native observability tradeoff.',
    memory: '@MANAGED_RESOURCE = JMX MBean export; @ManagedOperation/@ManagedAttribute.',
  },
  {
    id: 'conditional-on-expression',
    annotation: '@ConditionalOnExpression',
    family: 'gaps-core',
    what:
      '@Target(TYPE|METHOD) Boot meta-@Conditional with SpEL expression string (value attribute). OnExpressionCondition evaluates expression against BeanFactoryResolver + Environment — true registers bean/@Configuration. Supports bean references (#{@myBean}), property placeholders (#{${feature}}), and boolean logic. Spring Boot 3 / Framework 6.',
    why:
      'Complex activation logic beyond @ConditionalOnProperty single key — combine multiple properties, bean presence, and environment profiles in one SpEL expression without custom Condition class.',
    example: `@Configuration
@ConditionalOnExpression(
    "\${payments.kafka.enabled:false} and \${spring.kafka.bootstrap-servers:} != ''")
public class KafkaPaymentsConfig {}

@Bean
@ConditionalOnExpression("#{environment.acceptsProfiles('prod') && @environment.getProperty('audit.enabled') == 'true'}")
public AuditExporter auditExporter() {
  return new AuditExporter();
}`,
    processor:
      'OnExpressionCondition implements ConfigurationCondition. Parses SpEL via SpelExpressionParser with BeanExpressionContext (access to BeanFactory, Environment). Evaluated at REGISTER_BEAN or PARSE_CONFIGURATION phase depending on target. False → skip silently. Part of ConditionEvaluationReport.',
    when:
      'Multi-property AND/OR gates, profile + property combos, conditional on bean method result via SpEL. Prefer @ConditionalOnProperty for simple flags — SpEL when logic complex.',
    flow: `1. ConfigurationClassParser registers @Bean with @ConditionalOnExpression
2. OnExpressionCondition.matches() invoked
3. SpEL parsed — resolve PropertyPlaceholder \${...} via Environment
4. BeanFactoryResolver enables @beanName references
5. Expression must evaluate to Boolean true
6. false → BeanDefinition skipped; true → registered`,
    lifecycle:
      'Evaluated at context refresh during condition phase — not re-evaluated on property change unless context restarted or @RefreshScope subset.',
    proxy:
      'N/A — gates registration only.',
    runtime:
      'SpEL errors in expression → context failure or false depending on exception. #{@bean} requires bean already registered — ordering matters for REGISTER_BEAN phase.',
    failure:
      'SpEL typo — bean not registered, silent without debug. Referencing bean not yet defined — false negative. Expression returning non-Boolean — IllegalStateException.',
    debug:
      '--debug ConditionEvaluationReport shows OnExpressionCondition outcome and expression. Log expression string and result at TRACE.',
    production:
      'Keep expressions readable — extract to @ConditionalOnProperty when possible. Document SpEL in README. Fail closed for security-related beans.',
    mistakes: [
      'Overly complex SpEL in annotation — unmaintainable',
      'Referencing beans before they exist in expression on @Configuration class',
      'Missing default in ${prop:default} causing parse failure',
      'Using @ConditionalOnExpression for simple single property',
    ],
    traps: [
      'Interview: @ConditionalOnExpression = SpEL OnExpressionCondition',
      '${} property placeholders resolved before SpEL evaluation',
      '#{@beanName} needs bean in context — phase timing',
      'Contrast @ConditionalOnProperty havingValue vs free SpEL',
    ],
    answer15s:
      '@ConditionalOnExpression registers a bean when SpEL expression evaluates to true, using Environment and BeanFactory in OnExpressionCondition.',
    answer60s:
      '@ConditionalOnExpression meta-@Conditional with SpEL value. OnExpressionCondition evaluates against properties and beans. Use for complex boolean gates. Debug via ConditionEvaluationReport. Prefer simpler composed conditions when possible.',
    answer3m:
      'Mechanism: SpelExpressionParser + BeanExpressionContext. Phases: PARSE_CONFIGURATION vs REGISTER_BEAN affect bean references. Examples: profile and property combo, kafka enabled and bootstrap servers non-empty. Pitfalls: silent skip, SpEL errors, ordering. vs custom Condition class for testability. Boot 3 jakarta unchanged for condition model. Production: simplify, document, --debug.',
    memory: '@CONDITIONAL_ON_EXPRESSION = SpEL gate → OnExpressionCondition.',
  },
  {
    id: 'conditional-on-resource',
    annotation: '@ConditionalOnResource',
    family: 'gaps-core',
    what:
      '@Target(TYPE|METHOD) Boot meta-@Conditional — matches when specified resources exist on classpath or filesystem via ResourceLoader. Attributes: resources (String[] locations), ResourceCondition uses ResourceLoader.getResource().exists(). Common pattern: classpath:META-INF/services/foo, file:/etc/app/flag, classpath:db/migration enabled check.',
    why:
      'Activate configuration when marker file or optional module resource present without loading classes (classpath-safe). Lighter than @ConditionalOnClass when only resource presence matters.',
    example: `@Configuration
@ConditionalOnResource(resources = "classpath:META-INF/acme-legacy-mode")
public class LegacyAdapterConfig {}

@AutoConfiguration
@ConditionalOnResource(resources = "file:/etc/payments/feature-on.flag")
public class FileGatedAutoConfiguration {}`,
    processor:
      'OnResourceCondition implements SpringBootCondition. For each resource path in resources attribute, ResourceLoader.getResource(location).exists() must be true (AND semantics across array). Evaluated during auto-configuration import filtering and @Bean registration. Logged in ConditionEvaluationReport.',
    when:
      'Optional jar marker files, filesystem feature flags in VM/bare-metal deploys, classpath service descriptor presence. Complement @ConditionalOnClass for optional modules.',
    flow: `1. AutoConfigurationImportSelector candidate list loaded
2. OnResourceCondition.matches for @AutoConfiguration class
3. ResourceLoader checks classpath:META-INF/acme-legacy-mode exists
4. false → class filtered from import list
5. true → configuration parsed and @Beans registered`,
    lifecycle:
      'Checked at context refresh — resource deleted after startup does not deactivate beans.',
    proxy:
      'N/A.',
    runtime:
      'classpath: resources use ClassLoader; file: uses filesystem. Fat JAR nested classpath resources work via Spring Resource abstraction.',
    failure:
      'Typo in resource path — condition false, feature silently off. file: path wrong in container — expected config missing. Assuming OR semantics — array is AND (all must exist).',
    debug:
      'ConditionEvaluationReport entry for OnResourceCondition with resource paths. Manually resourceLoader.getResource(path).exists() in test.',
    production:
      'Prefer @ConditionalOnProperty for feature flags in cloud (ConfigMap). file: conditions brittle in Kubernetes — use properties. Document required marker resources in ops runbooks.',
    mistakes: [
      'Wrong classpath: prefix — resource not found',
      'Expecting OR when multiple resources listed (AND required)',
      'Using @ConditionalOnResource instead of @ConditionalOnClass for class presence',
      'Filesystem paths in containers that differ from dev',
    ],
    traps: [
      'Interview: @ConditionalOnResource = ResourceLoader.exists() for all listed paths',
      'AND not OR across resources array',
      'classpath vs file semantics',
      'Silent disable when marker file absent — debug with report',
    ],
    answer15s:
      '@ConditionalOnResource activates configuration when all specified resources exist, checked by OnResourceCondition via ResourceLoader.',
    answer60s:
      '@ConditionalOnResource meta-@Conditional with resources array. OnResourceCondition verifies each Resource exists. Used for marker files and optional module resources. AND semantics. ConditionEvaluationReport shows outcomes.',
    answer3m:
      'Use cases: legacy mode marker in META-INF, filesystem gate on bare metal. Mechanism: ResourceLoader.getResource.exists(). vs @ConditionalOnClass (loads class metadata). vs @ConditionalOnProperty (env keys). Production K8s: avoid file: gates. Pitfalls: typos, AND semantics, post-start resource deletion irrelevant. Boot 3 same behavior. Debug --debug report.',
    memory: '@CONDITIONAL_ON_RESOURCE = all resources must exist (AND).',
  },
  {
    id: 'conditional-on-single-candidate',
    annotation: '@ConditionalOnSingleCandidate',
    family: 'gaps-core',
    what:
      '@Target(TYPE|METHOD) Boot meta-@Conditional — matches when exactly one bean of specified type (value attribute) exists in BeanFactory after registration phase, or only one autowire candidate including primary resolution context. OnBeanCondition variant for unambiguous injection scenarios. Often paired with auto-config that needs a sole DataSource, PlatformTransactionManager, or RestTemplate.',
    why:
      'Auto-configuration @Bean that should only activate when type unambiguous — e.g. default DataSourceTransactionManager when exactly one DataSource bean exists. Prevents wrong wiring when zero or multiple candidates.',
    example: `@AutoConfiguration
@ConditionalOnSingleCandidate(DataSource.class)
public class DataSourceTransactionManagerAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean(PlatformTransactionManager.class)
  public PlatformTransactionManager transactionManager(DataSource dataSource) {
    return new DataSourceTransactionManager(dataSource);
  }
}`,
    processor:
      'OnBeanCondition subclass OnSingleCandidateCondition. At REGISTER_BEAN phase, queries beanFactory.getBeanNamesForType(DataSource.class, true, false) — counts candidates after applying @Primary uniqueness rules. Exactly one → match. Zero or multiple → no match. SearchStrategy configurable via @ConditionalOnSingleCandidate search attribute.',
    when:
      'Boot internal auto-config patterns. Custom auto-config providing default bean that requires unique dependency of type T. Complements @ConditionalOnBean (at least one) and @ConditionalOnMissingBean.',
    flow: `1. User or auto-config registers DataSource @Bean
2. DataSourceTransactionManagerAutoConfiguration evaluated
3. OnSingleCandidateCondition: getBeanNamesForType(DataSource)
4. Count == 1 → condition true → TX manager @Bean registered
5. Count == 2 (primary + other) → may fail condition depending on primary resolution`,
    lifecycle:
      'Evaluated during bean definition registration — must see final candidate set for type at evaluation moment.',
    proxy:
      'N/A.',
    runtime:
      'Multiple DataSource without @Primary → condition false → no auto TX manager — user must define. @MockBean in tests can create single mock satisfying condition.',
    failure:
      'Expected auto TX manager missing because two DataSource beans. False positive in test with @MockBean replacing one of two. Order: evaluated before all beans registered if wrong phase.',
    debug:
      'ConditionEvaluationReport OnBeanCondition message lists candidate count. getBeanNamesForType in debugger at refresh.',
    production:
      'Use @Primary on canonical DataSource when multiple exist intentionally. Understand auto-config backs off when ambiguous.',
    mistakes: [
      'Two DataSource beans without @Primary — auto-config silently skips',
      'Assuming @ConditionalOnBean implies single candidate',
      'Test @MockBean changing candidate count unexpectedly',
      'Ignoring search= SearchStrategy.CURRENT vs ALL for parent contexts',
    ],
    traps: [
      'Interview: @ConditionalOnSingleCandidate = exactly one bean of type',
      'Differs from @ConditionalOnBean (≥1) and @ConditionalOnMissingBean (0)',
      '@Primary does not create single candidate if two non-primary still exist — only one marked primary among multiple',
      'Auto-config TX manager classic example',
    ],
    answer15s:
      '@ConditionalOnSingleCandidate matches when exactly one bean of the given type exists — OnSingleCandidateCondition in Boot auto-config.',
    answer60s:
      '@ConditionalOnSingleCandidate ensures unambiguous type before registering dependent auto-config bean like DataSourceTransactionManager. OnBeanCondition counts candidates at REGISTER_BEAN phase. Multiple beans without resolution → condition false.',
    answer3m:
      'Boot pattern: @ConditionalOnSingleCandidate(DataSource) + @ConditionalOnMissingBean(PlatformTransactionManager). Candidate counting via BeanFactory.getBeanNamesForType. @Primary scenario: still multiple definitions may fail unless only one effective candidate. Testing: @MockBean effects. vs @ConditionalOnBean positive requirement. Production: @Primary for multi-DS setups. Debug report and bean name listing.',
    memory: '@CONDITIONAL_ON_SINGLE_CANDIDATE = exactly one bean of type.',
  },
  {
    id: 'import-auto-configuration',
    annotation: '@ImportAutoConfiguration',
    family: 'gaps-core',
    what:
      '@Target(TYPE) Boot test/slice annotation importing specific AutoConfiguration classes without full @EnableAutoConfiguration scan. Used on @WebMvcTest, @DataJpaTest, custom test slices, and test @Configuration to pull in subset of Boot auto-config (e.g. JacksonAutoConfiguration, HttpMessageConvertersAutoConfiguration). ImportAutoConfigurationImportSelector reads classes from annotation value or from META-INF/spring.imports association.',
    why:
      'Test slices need minimal infrastructure — not entire AutoConfiguration.imports list. @ImportAutoConfiguration explicitly adds auto-config classes required for test focus while @AutoConfigure* annotations exclude others.',
    example: `@WebMvcTest(controllers = OrderController.class)
// meta includes @ImportAutoConfiguration for MVC, Jackson, etc.

@Configuration
@ImportAutoConfiguration({
    JacksonAutoConfiguration.class,
    ValidationAutoConfiguration.class
})
class CustomMvcTestConfig {}

// Custom slice
@Target(ElementType.TYPE)
@ImportAutoConfiguration(MyServiceAutoConfiguration.class)
public @interface MyServiceTest {}`,
    processor:
      'ImportAutoConfigurationImportSelector implements ImportSelector — returns FQCN array from @ImportAutoConfiguration value and optional META-INF/spring/org.springframework.boot.autoconfigure.ImportAutoConfiguration entries for test slice annotation. Imported @AutoConfiguration classes processed by ConfigurationClassPostProcessor with conditions evaluated.',
    when:
      'Custom test slices, integration tests needing specific auto-config without @SpringBootTest full context. Extending Boot test annotations for internal modules.',
    flow: `1. Test class annotated @WebMvcTest
2. @ImportAutoConfiguration on slice meta-annotation
3. ImportAutoConfigurationImportSelector.selectImports()
4. Returns subset: WebMvcAutoConfiguration, JacksonAutoConfiguration, ...
5. ConfigurationClassPostProcessor registers those @AutoConfiguration classes
6. @AutoConfigureMockMvc etc. add further test beans`,
    lifecycle:
      'Test ApplicationContext refresh only — imports evaluated per test context cache key.',
    proxy:
      'Imported auto-config may register AOP infrastructure — normal proxy rules apply to beans from imported config.',
    runtime:
      'Test context lighter than production — missing beans from non-imported auto-config unless @MockBean added.',
    failure:
      'Missing import — NoSuchBeanDefinitionException for HttpMessageConverters etc. Importing too much — slow tests approaching @SpringBootTest. Wrong auto-config class for reactive vs servlet stack.',
    debug:
      'DEBUG org.springframework.boot.test.autoconfigure — slice bootstrap log lists imported auto-config. ConditionEvaluationReport in test.',
    production:
      'Primarily test infrastructure — production code uses @EnableAutoConfiguration / @SpringBootApplication. Custom starters may document @ImportAutoConfiguration for test support modules.',
    mistakes: [
      'Using @ImportAutoConfiguration on main @SpringBootApplication instead of proper auto-config registration',
      'Forgetting Jackson auto-config in custom slice — JSON test failures',
      'Mixing servlet and reactive auto-config imports',
      'Importing full DataSource auto-config when slice should mock DB',
    ],
    traps: [
      'Interview: @ImportAutoConfiguration = selective auto-config for tests/slices',
      'Used internally by @WebMvcTest, @DataJpaTest meta-annotations',
      'ImportAutoConfigurationImportSelector not same as AutoConfigurationImportSelector',
      'Pair with @AutoConfigureXxx exclude filters',
    ],
    answer15s:
      '@ImportAutoConfiguration imports specific Boot AutoConfiguration classes — mainly for test slices via ImportAutoConfigurationImportSelector.',
    answer60s:
      '@ImportAutoConfiguration on test configuration or slice annotation imports listed @AutoConfiguration classes without full enable auto-config scan. Powers Boot test slices alongside @AutoConfigureMockMvc etc. Custom slices for module tests.',
    answer3m:
      'Selector: ImportAutoConfigurationImportSelector.selectImports. Slice design: minimal auto-config + @MockBean for collaborators. @WebMvcTest imports MVC/Jackson/validation subset. Custom @MyIntegrationTest composes imports. Contrast production AutoConfigurationImportSelector loading full imports file. Pitfalls: missing converter config, too heavy imports. Boot 3 AutoConfiguration.imports file for registering auto-config classes themselves — separate concern from @ImportAutoConfiguration consumer.',
    memory: '@IMPORT_AUTO_CONFIGURATION = cherry-pick auto-config (tests/slices).',
  },
];
