import type {AnnotationCard} from './types';

export const DI: AnnotationCard[] = [
  {
    id: 'autowired',
    annotation: '@Autowired',
    family: 'di',
    what:
      '@Target(CONSTRUCTOR, METHOD, FIELD, PARAMETER) marks injection points for dependency resolution by type. Since Spring Framework 4.3, single-constructor @Autowired is optional. In Spring 6 / Boot 3, constructor injection is the recommended style; field injection still supported via AutowiredAnnotationBeanPostProcessor.',
    why:
      'Declarative wiring without manual getBean() lookups. Integrates with JSR-330 @Inject semantics (Spring extends with required=false, @Qualifier support). Enables testability when combined with constructor injection.',
    example: `@Service
public class PaymentService {
  private final PaymentGateway gateway;
  private final MeterRegistry metrics;

  @Autowired // optional when only one constructor
  public PaymentService(PaymentGateway gateway, MeterRegistry metrics) {
    this.gateway = gateway;
    this.metrics = metrics;
  }
}`,
    processor:
      'AutowiredAnnotationBeanPostProcessor (BeanPostProcessor) discovers @Autowired on constructors, fields, methods during populateBean. Builds InjectionMetadata (cached per bean class). Each injection point wrapped in DependencyDescriptor. Resolution: DefaultListableBeanFactory.doResolveDependency → resolveDependency(descriptor, name, type, ...) considering @Qualifier, @Primary, @Value on parameter, Optional, ObjectProvider, Collection/map types.',
    when:
      'Constructor injection for required dependencies (default). Field/setter injection only for legacy or framework constraints. Use @Autowired(required=false) or Optional<T> for optional deps.',
    flow: `Internal @Autowired resolution chain:
1. AbstractAutowireCapableBeanFactory.createBean → populateBean(beanName, instance)
2. AutowiredAnnotationBeanPostProcessor.postProcessProperties (or postProcessPropertyValues legacy)
3. InjectionMetadata.inject(instance, beanName, pvs) — iterate InjectionElements
4. Each element: DependencyDescriptor for field/parameter/method
5. beanFactory.resolveDependency(descriptor, name, type, ...)
6. DefaultListableBeanFactory.doResolveDependency:
   a. Shortcut: @Value → resolveEmbeddedValue
   b. findAutowireCandidates (all beans matching type)
   c. determineAutowireCandidate — @Primary, @Priority, @Qualifier match
   d. if single match → getBean; multiple → NoUniqueBeanDefinitionException
7. Reflective set field / invoke constructor / setter with resolved bean`,
    lifecycle:
      'Injection occurs once per bean instance during creation, before initializeBean (@PostConstruct). Prototype beans: injection repeated per instance. No re-injection on singleton unless refresh.',
    proxy:
      '@Autowired injects the bean reference from container — if target is AOP-proxied, you get the proxy (singleton cache stores exposed object). Injecting concrete class when only interface proxy exists may fail unless typed to interface.',
    runtime:
      'Resolved dependencies are references to singleton (or scoped) beans in DefaultSingletonBeanRegistry. Lazy dependencies: @Lazy on injection point injects proxy that resolves on first method call.',
    failure:
      'NoSuchBeanDefinitionException — no candidate, required=true. NoUniqueBeanDefinitionException — multiple candidates, no @Qualifier/@Primary. BeanCurrentlyInCreationException — circular dependency (constructor cycle). UnsatisfiedDependencyException wraps cause with injection point metadata.',
    debug:
      'logging.level.org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor=DEBUG. Exception message shows which field/parameter failed. spring.main.allow-circular-references=true (Boot) masks constructor cycles — avoid in prod.',
    production:
      'Constructor injection only; make dependencies final. Use @Qualifier or @Primary to disambiguate. Prefer ObjectProvider<T> for optional or multiple lazy resolution. Avoid field injection in new code.',
    mistakes: [
      'Field @Autowired on singleton holding mutable request state',
      'Missing @Qualifier when two implementations of same interface',
      'Assuming @Autowired by concrete class works with JDK interface proxy',
      'Circular constructor injection between two beans',
      'Using @Autowired on static fields — not supported',
    ],
    traps: [
      'Interview flow: populateBean → InjectionMetadata → DependencyDescriptor → resolveDependency',
      '@Autowired on package-private constructor in different package — injection may fail',
      'Collection injection: List<PaymentGateway> gets ALL beans of type — empty list if none',
      'Self-injection of @Lazy proxy vs real bean behavior',
    ],
    answer15s:
      '@Autowired marks injection points. AutowiredAnnotationBeanPostProcessor during populateBean uses InjectionMetadata and DependencyDescriptor to call resolveDependency by type, with @Qualifier/@Primary disambiguation.',
    answer60s:
      '@Autowired is processed by AutowiredAnnotationBeanPostProcessor at populateBean time. InjectionMetadata caches reflection metadata per class. Each injection point becomes a DependencyDescriptor; DefaultListableBeanFactory.resolveDependency finds candidates by type, applies @Qualifier (wins when specified) then @Primary, then @Priority. Constructor injection preferred; single constructor needs no @Autowired in Spring 4.3+.',
    answer3m:
      'Walk chain: createBean → instantiate (constructor autowire may resolve args first) → populateBean → AutowiredAnnotationBeanPostProcessor.postProcessProperties → InjectionMetadata.inject → for each DependencyDescriptor, doResolveDependency: handle @Value, findAutowireCandidates, determineAutowireCandidate (Qualifier beats Primary when qualifier specified on injection point), getBean. Optional/ObjectProvider/Lazy special cases. Constructor cycles: Spring Boot can fall back to setter/field for half the cycle if allowed. Contrast @Resource name-first. Production: final fields, explicit qualifiers, no circular refs.',
    memory: 'AUTOWIRED: populateBean → InjectionMetadata → DependencyDescriptor → resolveDependency.',
    tables: [
      {
        headers: ['Step', 'Class / method', 'Purpose'],
        rows: [
          ['1', 'AbstractAutowireCapableBeanFactory.populateBean', 'Orchestrate property injection'],
          ['2', 'AutowiredAnnotationBeanPostProcessor.postProcessProperties', 'Find @Autowired sites'],
          ['3', 'InjectionMetadata.inject', 'Iterate injection elements'],
          ['4', 'DependencyDescriptor', 'Wrap field/parameter + annotations'],
          ['5', 'DefaultListableBeanFactory.resolveDependency', 'Resolve to bean instance'],
          ['6', 'determineAutowireCandidate', 'Apply @Qualifier, @Primary, @Priority'],
        ],
      },
    ],
  },
  {
    id: 'qualifier',
    annotation: '@Qualifier',
    family: 'di',
    what:
      'JSR-330 compatible @Qualifier("beanName") disambiguates injection when multiple beans implement the same type. Can be on bean definition (@Bean("stripe") @Qualifier("stripe")) or injection point (@Autowired @Qualifier("stripe") PaymentGateway gw). Custom @Qualifier meta-annotations supported.',
    why:
      'Type-only injection fails with NoUniqueBeanDefinitionException when multiple candidates exist. @Qualifier selects by bean name or custom qualifier attribute without coupling to concrete implementation class.',
    example: `@Bean
@Qualifier("stripe")
public PaymentGateway stripeGateway() { return new StripeGateway(); }

@Bean
@Qualifier("adyen")
public PaymentGateway adyenGateway() { return new AdyenGateway(); }

@Service
public class CheckoutService {
  public CheckoutService(@Qualifier("stripe") PaymentGateway gateway) {
    this.gateway = gateway;
  }
}`,
    processor:
      'AutowiredAnnotationBeanPostProcessor passes DependencyDescriptor with @Qualifier annotation to ContextAnnotationAutowireCandidateResolver.checkQualifiers and DefaultListableBeanFactory.determineAutowireCandidate. Matching qualifier on bean definition (QualifierAnnotationAutowireCandidateResolver) filters candidates. When @Qualifier present on injection point, it takes precedence over @Primary for candidate selection.',
    when:
      'Multiple beans of same type. Prefer @Qualifier on constructor parameter over field. Custom qualifier annotations for semantic labels (@Stripe, @Adyen meta-annotated @Qualifier).',
    flow: `1. resolveDependency finds all beans of type PaymentGateway → [stripe, adyen]
2. Injection point has @Qualifier("stripe")
3. determineAutowireCandidate filters to beans whose definition matches qualifier
4. Single match → inject stripe bean
5. If @Qualifier + @Primary conflict: specified @Qualifier on injection point WINS`,
    lifecycle:
      'Qualifier metadata read at injection time from AnnotationMetadata on bean definition and injection point — static for bean lifetime.',
    proxy:
      'Qualifier selects which bean reference to inject — may be proxied bean if that bean is advised.',
    runtime:
      'Bean name and custom qualifier attributes stored in BeanDefinition; AutowireCandidateResolver checks at injection.',
    failure:
      'NoUniqueBeanDefinitionException — @Qualifier typo, no matching bean. NoSuchBeanDefinitionException — qualifier too strict. Missing @Qualifier when two @Primary beans (still ambiguous).',
    debug:
      'List beans of type: getBeanNamesForType(PaymentGateway.class). Check @Bean name vs @Qualifier value alignment. Actuator /beans.',
    production:
      'Stable qualifier strings or custom annotation types. Document which implementation is default (@Primary) vs named. Avoid stringly-typed qualifiers across modules — use custom annotation.',
    mistakes: [
      'Typo in @Qualifier string vs @Bean name',
      'Expecting @Primary to override explicit @Qualifier on another bean — wrong direction',
      'Using @Qualifier without @Autowired on field (required together except constructor)',
      'Multiple @Qualifier annotations without custom composed qualifier',
    ],
    traps: [
      'Interview: @Qualifier on injection point beats @Primary when both apply',
      '@Qualifier on @Bean registers qualifier metadata — name alone is not enough for custom qualifiers',
      'Spring @Qualifier vs JSR-330 — Spring adds value attribute',
      'Parameter name as implicit qualifier only with -parameters compile flag (not @Qualifier replacement)',
    ],
    answer15s:
      '@Qualifier disambiguates multiple beans of the same type. When specified on the injection point, it wins over @Primary in candidate resolution.',
    answer60s:
      '@Qualifier filters autowire candidates by bean name or custom qualifier annotation. AutowiredAnnotationBeanPostProcessor includes qualifier metadata in DependencyDescriptor; determineAutowireCandidate applies it before falling back to @Primary. Use on constructor parameters with multiple implementations.',
    answer3m:
      'Resolution order when multiple PaymentGateway beans: (1) if injection point has @Qualifier, filter matching definitions; (2) else if exactly one @Primary among candidates, choose it; (3) else if single candidate by type; (4) else NoUniqueBeanDefinitionException. QualifierAnnotationAutowireCandidateResolver matches bean-level @Qualifier. Custom meta-annotations: @Stripe composed with @Qualifier("stripe"). Contrast @Primary which marks default when no qualifier specified. Production: custom qualifier types, consistent @Bean naming.',
    memory: 'QUALIFIER on injection point beats @Primary — filter by name/custom annotation.',
    tables: [
      {
        headers: ['Scenario', 'Winner', 'Exception if unresolved'],
        rows: [
          ['@Qualifier("stripe") on parameter', 'Bean with matching qualifier/name', 'NoSuchBeanDefinitionException'],
          ['No qualifier, one @Primary', '@Primary bean', '—'],
          ['No qualifier, no @Primary, 2+ beans', '—', 'NoUniqueBeanDefinitionException'],
          ['@Qualifier + @Primary on different beans', '@Qualifier target', '—'],
        ],
      },
    ],
  },
  {
    id: 'primary',
    annotation: '@Primary',
    family: 'di',
    what:
      '@Primary on a bean definition marks it as the default candidate when autowiring by type and multiple beans qualify. Meta-annotation on @Bean or @Component class. Does not apply when injection point specifies @Qualifier.',
    why:
      'Avoid sprinkling @Qualifier on every injection site when one implementation is the common default. Secondary implementations remain injectable explicitly via @Qualifier or @Bean name.',
    example: `@Bean
@Primary
public CacheManager redisCacheManager(RedisConnectionFactory cf) {
  return RedisCacheManager.create(cf);
}

@Bean
public CacheManager caffeineCacheManager() {
  return new CaffeineCacheManager();
}

@Service
public class ProductService {
  // injects redisCacheManager without @Qualifier
  public ProductService(CacheManager cacheManager) { ... }
}`,
    processor:
      'Primary annotation on BeanDefinition → primary attribute true. DefaultListableBeanFactory.isPrimary(candidate) checked in determineAutowireCandidate when multiple type matches and no @Qualifier on injection point. If exactly one primary among candidates, selected; multiple primaries → still ambiguous.',
    when:
      'One default implementation among several of same interface. Pair with named @Bean for alternates. Do not mark multiple @Primary for same type.',
    flow: `1. resolveDependency(CacheManager) → [redis, caffeine]
2. No @Qualifier on injection point
3. determineAutowireCandidate marks redis as primary match
4. Inject redis CacheManager
5. If injection used @Qualifier("caffeine") → primary ignored`,
    lifecycle:
      'Primary flag on BeanDefinition at registration — unchanged at runtime.',
    proxy:
      'Primary selects which bean — proxy behavior follows selected bean.',
    runtime:
      'getBean(CacheManager.class) returns @Primary bean when multiple exist (since 4.0).',
    failure:
      'NoUniqueBeanDefinitionException — two @Primary beans of same type. Unexpected bean — wrong @Primary on production config.',
    debug:
      'Inspect BeanDefinition.isPrimary() in debugger. Condition report for auto-config @Primary beans.',
    production:
      'Exactly one @Primary per conflicting type. Document override path with @Qualifier. Boot auto-config often uses @Primary for default templates.',
    mistakes: [
      'Two @Primary CacheManager beans',
      'Expecting @Primary to override explicit @Qualifier',
      'Using @Primary instead of proper abstraction boundaries',
      '@Primary on test @MockBean conflicting with prod bean in slice tests',
    ],
    traps: [
      'Interview: @Qualifier wins over @Primary when qualifier specified at injection point',
      'getBean(Type) uses @Primary — raw getBean("name") does not',
      'Auto-config @Primary + user @Bean without @ConditionalOnMissingBean — user bean may still win by ordering',
      '@Primary on interface @Bean return vs implementation',
    ],
    answer15s:
      '@Primary marks the default bean when multiple candidates match a type without @Qualifier. Qualifier on the injection point always wins over @Primary.',
    answer60s:
      '@Primary sets primary=true on BeanDefinition. During resolveDependency, if multiple type matches and no @Qualifier on injection point, the single @Primary candidate is chosen. Multiple @Primary beans cause ambiguity. Explicit @Qualifier at injection point overrides @Primary.',
    answer3m:
      'determineAutowireCandidate algorithm: filter by type → apply qualifier if present on descriptor → if multiple remain, prefer unique @Primary → else fail. Use @Primary for default Redis cache, @Qualifier for special cases. Boot: @Primary DataSource from auto-config unless user defines own. Testing: @MockBean replaces primary. Pitfalls: dual @Primary, assuming primary applies across unrelated types. vs @Priority (javax.annotation) — lower priority value preferred among equals, different mechanism from @Primary.',
    memory: 'PRIMARY = default when no @Qualifier; never beats explicit @Qualifier.',
  },
  {
    id: 'resource',
    annotation: '@Resource',
    family: 'di',
    what:
      'JSR-250 jakarta.annotation.Resource on field or setter. Injection by name first (name or mappedName attribute), then type if name unresolved. Processed by CommonAnnotationBeanPostProcessor, not AutowiredAnnotationBeanPostProcessor.',
    why:
      'Jakarta EE compatibility and name-driven wiring matching JNDI-style semantics. Useful when bean name is stable and type alone is ambiguous. Different resolution order than @Autowired — name before type.',
    example: `@Service
public class NotificationService {
  @Resource(name = "smtpMailSender")
  private MailSender mailSender;

  // name defaults to field name "auditLogger" if bean exists
  @Resource
  private Logger auditLogger;
}`,
    processor:
      'CommonAnnotationBeanPostProcessor handles @Resource, @PostConstruct, @PreDestroy. For @Resource: resolve bean name from annotation name attribute, or field name, or property name from setter. Call getBean(name) first; if not found, fall back to autowire by type (AutowiredAnnotationBeanPostProcessor delegation path). Order: NAME → TYPE.',
    when:
      'Legacy Jakarta EE migration. Explicit bean name wiring. When you want field-name convention without @Qualifier strings on @Autowired.',
    flow: `1. populateBean → CommonAnnotationBeanPostProcessor.postProcessProperties
2. @Resource on field smtpMailSender — name default "smtpMailSender"
3. getBean("smtpMailSender") if exists → inject
4. Else resolve by type MailSender (may still need @Primary if multiple)
5. @PostConstruct on same class also processed by this BPP`,
    lifecycle:
      'Injected once at bean creation. @PostConstruct runs after injection in initialization phase.',
    proxy:
      'Injects named bean from registry — proxy if advised.',
    runtime:
      'jakarta.annotation.Resource in Boot 3 (javax.annotation in Boot 2). CommonAnnotationBeanPostProcessor registered by default in annotation-config contexts.',
    failure:
      'NoSuchBeanDefinitionException — name not found and type resolution fails. Ambiguous type fallback after name miss.',
    debug:
      'Compare bean name list with @Resource name. Check CommonAnnotationBeanPostProcessor order relative to AutowiredAnnotationBeanPostProcessor.',
    production:
      'Prefer constructor @Autowired + @Qualifier in new Spring code. Use @Resource when integrating EE patterns or name is the contract.',
    mistakes: [
      'Assuming @Resource same as @Autowired — different BPP and name-first order',
      'Field name mismatch with @Bean method name',
      'Using @Resource on constructor — not standard (field/setter only)',
      'Mixing @Resource name with wrong type fallback bean',
    ],
    traps: [
      'Interview: @Resource = by name first, then by type; @Autowired = by type first',
      '@Resource on field "mailSender" looks for bean mailSender before type MailSender',
      'CommonAnnotationBeanPostProcessor also runs @PostConstruct — ordering with other BPP',
      'Boot 3 jakarta.annotation.Resource vs javax in older guides',
    ],
    answer15s:
      '@Resource (JSR-250) injects by bean name first, then by type. CommonAnnotationBeanPostProcessor handles it — different from @Autowired resolution order.',
    answer60s:
      '@Resource uses name attribute or field/property name for getBean(name), falling back to type match if name fails. Processed by CommonAnnotationBeanPostProcessor alongside @PostConstruct. @Autowired resolves type first with @Qualifier/@Primary. Use @Resource for name-centric Jakarta EE style wiring.',
    answer3m:
      'CommonAnnotationBeanPostProcessor.postProcessProperties builds InjectionMetadata for @Resource. Name resolution: explicit name → default field name. Fallback autowire by type uses bean factory. Contrast @Autowired DependencyDescriptor pipeline. @Resource not recommended for constructor in Spring — use @Autowired. EE migration scenarios. Pitfalls: field name typo, expecting qualifier semantics — use @Resource name not @Qualifier. Both BPP run in populateBean — know ordering (CommonAnnotation at ORDER_LOWEST_PRECEDENCE - 2).',
    memory: '@RESOURCE = name first, then type (CommonAnnotationBeanPostProcessor).',
    tables: [
      {
        headers: ['', '@Autowired', '@Resource'],
        rows: [
          ['Processor', 'AutowiredAnnotationBeanPostProcessor', 'CommonAnnotationBeanPostProcessor'],
          ['First match by', 'Type (+ @Qualifier/@Primary)', 'Name (then type)'],
          ['Constructor', 'Supported (preferred)', 'Not standard'],
          ['Spec', 'Spring + JSR-330', 'JSR-250 Jakarta'],
        ],
      },
    ],
  },
  {
    id: 'inject',
    annotation: '@Inject',
    family: 'di',
    what:
      'JSR-330 jakarta.inject.Inject — standardized injection marker. In Spring, treated equivalently to @Autowired for resolution (AutowiredAnnotationBeanPostProcessor also processes @Inject). Supports constructor, field, method injection. No required=false attribute — use Optional<T> for optional.',
    why:
      'Portable code across CDI and Spring. Library modules can depend on jakarta.inject-api without spring-beans. Spring fills the runtime with full DI features (@Qualifier, @Primary still apply).',
    example: `import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.inject.Singleton;

@Singleton // Spring: scope annotation mapping via CustomScopeConfigurer or stereotype
@Service
public class InventoryService {
  private final StockRepository repo;

  @Inject
  public InventoryService(StockRepository repo) {
    this.repo = repo;
  }
}`,
    processor:
      'AutowiredAnnotationBeanPostProcessor recognizes @Inject in addition to @Autowired (AutowiredAnnotationBeanPostProcessor short-circuits on both). Same InjectionMetadata / DependencyDescriptor / resolveDependency pipeline. @Named from JSR-330 maps to @Qualifier semantics in Spring.',
    when:
      'Multi-framework libraries, CDI migration, avoiding Spring-specific @Autowired in domain modules. Use @Named instead of @Qualifier for portability.',
    flow: `Same as @Autowired:
populateBean → AutowiredAnnotationBeanPostProcessor → InjectionMetadata → resolveDependency
@Named("stripe") on parameter ≡ @Qualifier("stripe")`,
    lifecycle:
      'Identical to @Autowired injection timing.',
    proxy:
      'Same as @Autowired — injects container-managed reference.',
    runtime:
      'jakarta.inject 2.x on Boot 3 classpath via spring-boot-starter. @Inject required=true always — optional via Optional wrapper.',
    failure:
      'Same exceptions as @Autowired. @Inject without provider for optional dep when bean missing.',
    debug:
      'Treat as @Autowired in logs. Verify jakarta.inject on classpath.',
    production:
      'Use @Inject + @Named in shared modules; @Autowired fine in application layer. Optional: Provider<T> or ObjectProvider<T> (Spring) vs jakarta.inject.Provider.',
    mistakes: [
      'Expecting @Inject(required=false) — does not exist, use Optional',
      'Mixing javax.inject and jakarta.inject after Boot 3 migration',
      'Assuming @Inject enables CDI full lifecycle — only injection in Spring',
      'Ignoring @Named for disambiguation',
    ],
    traps: [
      'Interview: @Inject in Spring = @Autowired resolution, processed by same BPP',
      '@Named("x") ≡ @Qualifier("x") for Spring',
      'CDI @Singleton ≠ Spring singleton unless @Scope("singleton")',
      'Provider<T> lazy get() vs Spring ObjectProvider advantages',
    ],
    answer15s:
      '@Inject is JSR-330; Spring processes it like @Autowired via AutowiredAnnotationBeanPostProcessor — same resolveDependency flow. @Named maps to @Qualifier.',
    answer60s:
      '@Inject is handled by AutowiredAnnotationBeanPostProcessor alongside @Autowired. Same InjectionMetadata and DependencyDescriptor resolution with @Primary and @Qualifier/@Named. No required attribute — use Optional for optional dependencies. Prefer for portable library code.',
    answer3m:
      'Spring as JSR-330 implementation: scan @Inject points, resolve identically to @Autowired. @Named value maps to qualifier. Differences: no required=false; Provider injection supported. Boot 3 jakarta namespace. Contrast @Resource name-first. When to use: shared kernels vs Spring apps using @Autowired convention. ObjectProvider Spring-specific enhancements over Provider.',
    memory: '@INJECT = @Autowired path in Spring; @Named = @Qualifier.',
  },
  {
    id: 'value',
    annotation: '@Value',
    family: 'di',
    what:
      '@Target(FIELD, METHOD, PARAMETER) injects scalar values from property sources, SpEL expressions, or defaults: @Value("${app.timeout:30}") int timeout. Processed by AutowiredAnnotationBeanPostProcessor as special DependencyDescriptor with embedded value resolution before bean lookup.',
    why:
      'Wire environment-specific config (URLs, flags, pool sizes) without hardcoding. Supports SpEL for computed values and property placeholders from application.yml, env vars, command line.',
    example: `@Service
public class RateLimiter {
  public RateLimiter(
      @Value("\${app.rate-limit:100}") int limit,
      @Value("#{\${app.enabled} and systemProperties['os.name'] != null}") boolean enabled) {
    this.limit = limit;
    this.enabled = enabled;
  }
}`,
    processor:
      'AutowiredAnnotationBeanPostProcessor detects @Value on DependencyDescriptor. DefaultListableBeanFactory.resolveDependency → resolveEmbeddedValue for ${...} via PropertySourcesPlaceholderConfigurer / EmbeddedValueResolver (EnvironmentPropertyResolver in Boot). SpEL via StandardBeanExpressionResolver. No bean candidate search for pure @Value String/int.',
    when:
      'Individual scalar config values, feature flags, timeouts. NOT for binding groups of related properties — use @ConfigurationProperties.',
    flow: `1. populateBean → @Value on field limit
2. DependencyDescriptor.isValue() true
3. resolveEmbeddedValue("\${app.rate-limit:100}") → Environment.getProperty
4. Type conversion via ConversionService (String → int)
5. Set field value — no getBean involved`,
    lifecycle:
      'Values injected once at bean creation from current Environment. Changing property at runtime does not refresh @Value fields unless @RefreshScope (Spring Cloud) or custom rebinding.',
    proxy:
      'No proxy — literal or converted value injected.',
    runtime:
      'Boot 3: application.yml, application-{profile}.yml, env vars (RELAXED_BINDING), command-line args merged in PropertySources. ${VAR:default} syntax.',
    failure:
      'IllegalArgumentException — could not resolve placeholder. ConversionFailedException — String to int failed. SpEL evaluation exception. Missing default and no property defined with required=true semantics.',
    debug:
      'logging.level.org.springframework.core.env=DEBUG. /actuator/env (if exposed). Echo resolved values at startup in @PostConstruct (careful with secrets).',
    production:
      'Never @Value secrets into logs. Use defaults for non-critical config. For 5+ related keys use @ConfigurationProperties. Validate with @Validated on properties class.',
    mistakes: [
      'Using many @Value fields instead of structured @ConfigurationProperties',
      'Storing secrets in @Value without encryption / vault integration',
      'SpEL too complex in @Value — hard to test',
      'Expecting hot reload without @RefreshScope',
      'Wrong property key typo silent with default only in prod',
    ],
    traps: [
      'Interview: @Value vs @ConfigurationProperties — scalar vs structured binding',
      '@Value on static field not supported',
      'SpEL #{...} vs placeholder ${...} syntax confusion',
      'Relaxed binding app.rate-limit vs app.rateLimit only on @ConfigurationProperties prefixes',
    ],
    answer15s:
      '@Value injects properties or SpEL expressions into fields/parameters via resolveEmbeddedValue — not bean lookup. Best for single scalars.',
    answer60s:
      '@Value processed by AutowiredAnnotationBeanPostProcessor as embedded value on DependencyDescriptor. Resolves ${property:default} from Environment with type conversion. SpEL #{...} supported. Does not refresh at runtime by default. For related properties use @ConfigurationProperties instead.',
    answer3m:
      'Resolution bypasses bean candidate search: resolveEmbeddedValue → PropertyResolver → ConversionService. Boot PropertySources order: command line, env, application.yml. Contrast @ConfigurationProperties: type-safe prefix binding, validation, relaxed binding, list/map support, @ConstructorBinding in Boot 3. Production: @ConfigurationProperties for service config groups; @Value for one-offs. Spring Cloud @RefreshScope for dynamic @Value. Security: externalize secrets.',
    memory: '@VALUE = scalar from Environment; not for struct config.',
    tables: [
      {
        headers: ['', '@Value', '@ConfigurationProperties'],
        rows: [
          ['Best for', 'Single keys, SpEL', 'Prefix-grouped settings (app.datasource.*)'],
          ['Binding', 'Per-field injection', 'Bulk bind to POJO/record'],
          ['Validation', 'Manual', '@Validated + JSR-303'],
          ['Relaxed binding', 'Exact key in ${}', 'app.max-size ↔ app.maxSize'],
          ['Refresh', 'Needs @RefreshScope', '@RefreshScope on @ConfigurationProperties bean'],
          ['IDE metadata', 'Limited', 'spring-boot-configuration-processor JSON'],
        ],
      },
    ],
  },
  {
    id: 'configuration-properties',
    annotation: '@ConfigurationProperties',
    family: 'di',
    what:
      '@Target(TYPE, METHOD) binds external configuration under a prefix to a Java bean (class or @Bean method return type). Boot 3 supports immutable @ConstructorBinding on records/constructors. Enable via @EnableConfigurationProperties, @ConfigurationPropertiesScan, or @Bean registration.',
    why:
      'Type-safe, validated, testable config object instead of dozens of @Value fields. IDE autocomplete via spring-boot-configuration-processor. Relaxed binding maps APP_DATASOURCE_URL env to app.datasource.url.',
    example: `@ConfigurationProperties(prefix = "app.payment")
@Validated
public record PaymentProperties(
    @NotNull URL webhookUrl,
    @Min(1) int retryAttempts,
    Duration timeout
) {}

@Configuration
@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentConfig {}

// application.yml:
// app:
//   payment:
//     webhook-url: https://api.example.com/hook
//     retry-attempts: 3
//     timeout: 5s`,
    processor:
      'ConfigurationPropertiesBindingPostProcessor (BeanPostProcessor) binds Environment to @ConfigurationProperties bean after instantiation. Boot: ConfigurationPropertiesBeanDefinitionRegistrar or @EnableConfigurationProperties registers bean. Binder (org.springframework.boot.context.properties.bind.Binder) maps PropertySources to object using JavaBean or constructor binding. Not AutowiredAnnotationBeanPostProcessor.',
    when:
      'Grouped configuration: datasource, feature modules, integration endpoints. Prefer record + constructor binding in Boot 3 for immutability.',
    flow: `1. @EnableConfigurationProperties(PaymentProperties.class) registers bean definition
2. Container instantiates PaymentProperties (constructor binding)
3. ConfigurationPropertiesBindingPostProcessor.beforeInitialization
4. Binder.bind("app.payment", PaymentProperties) pulls all matching keys
5. Relaxed binding + ConversionService (Duration, DataSize)
6. @Validated triggers JSR-303 validation
7. Bean ready for injection into services`,
    lifecycle:
      'Bound once at bean initialization. @RefreshScope (Cloud) recreates bean on refresh endpoint. @ConfigurationPropertiesScan discovers types at startup.',
    proxy:
      'No proxy — plain properties holder bean, inject into services.',
    runtime:
      'PaymentProperties injected as singleton. Access via injection, not static Environment lookups in business code.',
    failure:
      'BindException — validation failed, missing required property. BeanCreationException — wrong type conversion. Unknown prefix — empty object defaults may violate @NotNull.',
    debug:
      'logging.level.org.springframework.boot.context.properties=DEBUG. /actuator/configprops endpoint. Generate configuration-metadata.json for IDE hints.',
    production:
      'Immutable records with constructor binding. @Validated constraints. Never mix secrets in logs from toString — exclude sensitive fields. Use @NestedConfigurationProperty for nested groups.',
    mistakes: [
      'Mutable setters with partial binding in concurrent access',
      'Forgetting @EnableConfigurationProperties or @ConfigurationPropertiesScan',
      'Using @ConfigurationProperties without @Validated for required fields',
      'Prefix typo — silent defaults',
      'Expecting @Value-style SpEL in properties class fields',
    ],
    traps: [
      'Interview: @ConfigurationProperties = structured prefix bind; @Value = scalar',
      '@ConfigurationProperties on @Bean method — bind to return type',
      'Relaxed binding only for prefix keys not @Value placeholders',
      'Boot 3: @ConstructorBinding implicit on single constructor record',
    ],
    answer15s:
      '@ConfigurationProperties binds a config prefix to a type-safe bean via Binder — for grouped settings with validation, not single @Value scalars.',
    answer60s:
      '@ConfigurationProperties(prefix="app.x") creates a bean bound from Environment by ConfigurationPropertiesBindingPostProcessor and Binder. Supports relaxed binding, lists, maps, Duration. Enable with @EnableConfigurationProperties or scan. Boot 3: prefer records with constructor binding and @Validated over many @Value fields.',
    answer3m:
      'Registration: @EnableConfigurationProperties, @ConfigurationPropertiesScan (Boot 2.2+), or @Bean. Binding: Binder walks property tree under prefix, applies converters, constructor or setter binding. Validation: @Validated on type. Contrast @Value: per-field, SpEL, no relaxed binding on key. Production: configuration-metadata processor for IDE, immutable records, nested properties class. Cloud @RefreshScope. Failure: BindException with field errors. Security: sensitive fields with custom converter or external vault.',
    memory: 'CONFIG_PROPERTIES = prefix + Binder + validation; beats many @Values.',
    tables: [
      {
        headers: ['Enable mechanism', 'Annotation', 'When'],
        rows: [
          ['Explicit class', '@EnableConfigurationProperties(X.class)', 'Single known type'],
          ['Classpath scan', '@ConfigurationPropertiesScan', 'Many *Properties classes in package'],
          ['@Bean factory', '@Bean @ConfigurationProperties', 'Custom creation logic'],
          ['Auto-config', '@AutoConfiguration + @EnableConfigurationProperties', 'Starter modules'],
        ],
      },
      {
        headers: ['Binding style', 'Boot 3 pattern', 'Immutable?'],
        rows: [
          ['Constructor', 'record PaymentProperties(...)', 'Yes'],
          ['JavaBean setters', 'class with setters', 'No'],
          ['@Bean method', '@Bean @ConfigurationProperties(prefix)', 'Depends'],
        ],
      },
    ],
  },
];
