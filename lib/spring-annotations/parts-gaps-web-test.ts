import type {AnnotationCard} from './types';

export const GAPS_WEB_TEST: AnnotationCard[] = [
  {
    id: 'cross-origin',
    annotation: '@CrossOrigin',
    family: 'gaps-web-test',
    what:
      '@Target(TYPE|METHOD) on @Controller/@RestController configures CORS (Cross-Origin Resource Sharing) for browser clients. Attributes: origins (or originPatterns in Spring 5.3+), methods, allowedHeaders, exposedHeaders, allowCredentials, maxAge. Merged with global WebMvcConfigurer addCorsMappings. Preflight OPTIONS handled before security/auth on matched paths.',
    why:
      'Browser same-origin policy blocks SPA on app.example.com calling api.example.com unless server returns Access-Control-Allow-Origin headers. @CrossOrigin declaratively permits origins for REST endpoints without duplicating filter config on every controller.',
    example: `@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "https://app.acme.com", allowCredentials = "true", maxAge = 3600)
public class OrderController {

  @GetMapping("/{id}")
  public OrderDto get(@PathVariable Long id) { /* ... */ }

  @PostMapping
  @CrossOrigin(origins = "*", methods = RequestMethod.POST) // method-level override
  public OrderDto create(@RequestBody CreateOrderRequest req) { /* ... */ }
}`,
    processor:
      'RequestMappingHandlerMapping detects @CrossOrigin on handler class/method, attaches CorsConfiguration to RequestMappingInfo. CorsProcessor (DefaultCorsProcessor) applies on DispatcherServlet dispatch — preflight OPTIONS returns 204 with CORS headers before handler invoke. Global CorsConfigurationSource bean from WebMvcConfigurer merged with per-handler config.',
    when:
      'Public APIs consumed by browser SPAs. Method-level override for stricter origin on sensitive POST. Prefer centralized CorsConfigurationSource for many controllers — @CrossOrigin for exceptions.',
    flow: `Browser preflight:
1. OPTIONS /api/v1/orders with Origin + Access-Control-Request-Method
2. DispatcherServlet → CorsFilter / CorsProcessor
3. @CrossOrigin metadata merged → validate origin allowed
4. Return Access-Control-Allow-Origin, Allow-Methods, Allow-Headers
5. Actual GET/POST follows with CORS response headers on success`,
    lifecycle:
      'CORS metadata registered at startup with handler mappings. Per-request header injection.',
    proxy:
      'N/A — servlet filter / handler mapping metadata layer.',
    runtime:
      'allowCredentials=true incompatible with origins="*" — must list explicit origins. originPatterns supports subdomain patterns. Spring Security must enable cors() on SecurityFilterChain — else security blocks preflight.',
    failure:
      'CORS error in browser but 200 in curl — missing Allow-Origin. Preflight 403 — Spring Security CSRF/CORS order. Wildcard + credentials rejected by browsers.',
    debug:
      'Browser devtools Network → OPTIONS response headers. DEBUG org.springframework.web.cors. Verify SecurityFilterChain.cors(Customizer).',
    production:
      'Whitelist origins — never * with credentials. Centralize allowed origins per environment. Rate limit at gateway. CORS is not auth — still require JWT.',
    mistakes: [
      'origins="*" with allowCredentials=true — browser rejects',
      'Missing @CrossOrigin on @ControllerAdvice error responses — CORS headers absent on 4xx',
      'Only annotating controller — forgetting Spring Security cors() enablement',
      'Duplicating conflicting global and per-method CORS',
    ],
    traps: [
      'Interview: @CrossOrigin → RequestMappingHandlerMapping CORS metadata → CorsProcessor',
      'Preflight OPTIONS may not hit @PreAuthorize the same as main request — configure security CORS',
      'originPatterns vs origins (Boot 3 / SF 6)',
      'CORS headers on error responses need @ControllerAdvice CORS or global config',
    ],
    answer15s:
      '@CrossOrigin adds CORS headers for browser cross-origin requests; RequestMappingHandlerMapping stores config, CorsProcessor handles preflight OPTIONS.',
    answer60s:
      '@CrossOrigin on controller/method sets allowed origins, methods, headers. Merged with global WebMvcConfigurer CORS. Spring Security must enable cors(). allowCredentials requires explicit origins not wildcard.',
    answer3m:
      'Mechanism: handler mapping CORS attachment, DefaultCorsProcessor on dispatch. Preflight flow before actual request. Security integration: SecurityFilterChain cors configuration. Production whitelist per env. Pitfalls: wildcard+credentials, security blocking OPTIONS, error response CORS. vs gateway CORS at edge. Boot 3 jakarta.servlet unchanged for filter layer.',
    memory: '@CROSS_ORIGIN = CORS on handler; enable Security cors() too.',
  },
  {
    id: 'model-attribute-init-binder',
    annotation: '@ModelAttribute · @InitBinder',
    family: 'gaps-web-test',
    what:
      '@ModelAttribute: @Target(PARAMETER|METHOD) — method-level adds model attributes to MVC Model for view rendering; parameter-level binds request parameters/form fields to object (like @RequestBody for forms, not JSON). @InitBinder: @Target(METHOD) on @ControllerAdvice or controller registers WebDataBinder customizations — property editors, @DateTimeFormat, disallow fields, validator for command objects.',
    why:
      'Server-side MVC forms (Thymeleaf) need command object binding from query/form fields and shared formatting rules. @InitBinder centralizes date parsing, trimming strings, blocking mass-assignment fields (id, role). REST APIs use @RequestBody more often — @ModelAttribute still used for multipart forms and search filters.',
    example: `@Controller
@RequestMapping("/orders")
public class OrderFormController {

  @InitBinder
  public void initBinder(WebDataBinder binder) {
    binder.setDisallowedFields("id", "status"); // mass-assignment guard
    binder.registerCustomEditor(LocalDate.class, new PropertyEditorSupport() {
      @Override public void setAsText(String text) {
        setValue(LocalDate.parse(text));
      }
    });
  }

  @ModelAttribute("orderTypes")
  public List<OrderType> orderTypes() {
    return orderTypeService.findAll(); // shared model attr per request
  }

  @PostMapping
  public String submit(@Valid @ModelAttribute("order") OrderForm form, Model model) {
    orderService.create(form);
    return "redirect:/orders";
  }
}`,
    processor:
      '@ModelAttribute method: HandlerMethod annotated with @ModelAttribute resolved by ModelFactory before handler — invokes method, puts return value in Model. @ModelAttribute parameter: ServletRequestDataBinder binds request parameters to object via WebDataBinder. @InitBinder: @InitBinder methods discovered on @ControllerAdvice (global) or controller (local), invoked before binding for matching command types via @InitBinder value attribute.',
    when:
      'MVC form POST application/x-www-form-urlencoded. @ModelAttribute methods for dropdown data on every form request. @InitBinder for security (disallowedFields) and custom converters. REST: @ModelAttribute for GET search DTO from query params.',
    flow: `1. DispatcherServlet invokes HandlerMethod
2. ModelFactory invokes @ModelAttribute methods → Model populated
3. @InitBinder methods run → WebDataBinder configured
4. ServletRequestDataBinder binds request params → OrderForm
5. @Valid triggers jakarta.validation on bound object
6. Controller method runs with populated form`,
    lifecycle:
      '@ModelAttribute methods run before each matching handler request. @InitBinder per binding operation.',
    proxy:
      'N/A — MVC data binding pipeline.',
    runtime:
      'Binding errors → BindingResult parameter or exception. @ModelAttribute name defaults to parameter name or class name decapitalized.',
    failure:
      'Mass assignment — attacker sets disallowed id field if @InitBinder missing. Wrong date format without editor. @ModelAttribute on REST expecting JSON — use @RequestBody instead.',
    debug:
      'Log bound object after binding. TRACE WebDataBinder field access. Verify disallowedFields in security review.',
    production:
      'Always disallow sensitive fields in @InitBinder or DTO design. Prefer immutable command objects. For REST JSON, @RequestBody + @Valid standard.',
    mistakes: [
      'Using @ModelAttribute for JSON POST bodies',
      'Forgetting @InitBinder disallowedFields on mutable entities',
      '@ModelAttribute method throwing — breaks all handlers on controller',
      'Confusing @ModelAttribute with @RequestBody validation groups',
    ],
    traps: [
      'Interview: @InitBinder customizes WebDataBinder before @ModelAttribute binding',
      '@ControllerAdvice @InitBinder applies globally to matching types',
      '@ModelAttribute method runs before every handler in controller',
      'BindingResult must follow @ModelAttribute param for error handling',
    ],
    answer15s:
      '@ModelAttribute binds form/query data to objects or adds model attributes; @InitBinder configures WebDataBinder (disallowed fields, editors) before binding.',
    answer60s:
      '@ModelAttribute parameter: ServletRequestDataBinder binds request to command object. @ModelAttribute method: adds shared Model data. @InitBinder on controller/advice sets disallowedFields and custom editors — security and formatting before bind.',
    answer3m:
      'MVC form flow: ModelFactory → @InitBinder → data bind → @Valid. Security: disallowedFields against mass assignment. REST contrast: @RequestBody HttpMessageConverter for JSON. @ControllerAdvice global init binders. Thymeleaf th:object binding. Pitfalls: JSON vs form, missing BindingResult, date formats. Boot 3 jakarta.validation.',
    memory: '@MODEL_ATTRIBUTE = form bind; @INIT_BINDER = WebDataBinder setup.',
  },
  {
    id: 'request-part',
    annotation: '@RequestPart',
    family: 'gaps-web-test',
    what:
      '@Target(PARAMETER) binds multipart/form-data part to method argument — distinct from @RequestParam for simple fields. Supports @RequestPart("file") MultipartFile, @RequestPart("meta") @Valid MetaDto with application/json part Content-Type. Requires multipart request (MultipartResolver / StandardServletMultipartResolver in Boot 3).',
    why:
      'File upload APIs often send file + JSON metadata in single multipart request. @RequestPart uses HttpMessageConverter on part body (JSON → DTO) whereas @RequestParam only binds strings/simple types.',
    example: `@PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public DocumentDto upload(
    @RequestPart("file") MultipartFile file,
    @RequestPart("metadata") @Valid DocumentMetadata metadata) {
  return documentService.store(file, metadata);
}

// Client sends:
// --boundary
// Content-Disposition: form-data; name="file"; filename="report.pdf"
// Content-Type: application/pdf
// --boundary
// Content-Disposition: form-data; name="metadata"
// Content-Type: application/json
// {"title":"Q4 Report","tags":["finance"]}`,
    processor:
      'RequestPartMethodArgumentResolver (Servlet) / reactive equivalent in WebFlux. Resolves MultipartFile via MultipartHttpServletRequest.getFile. For @RequestPart DTO: RequestPartServletServerHttpRequest wraps part input stream, MappingJackson2HttpMessageConverter deserializes JSON part. @Valid runs jakarta.validation after conversion.',
    when:
      'Multipart uploads with structured JSON part. @RequestParam MultipartFile for file-only simple uploads. consumes MULTIPART_FORM_DATA required.',
    flow: `1. POST multipart/form-data to /documents
2. StandardServletMultipartResolver parses parts
3. RequestPartMethodArgumentResolver handles @RequestPart parameters
4. file → MultipartFile; metadata part → Jackson → DocumentMetadata
5. @Valid validates metadata
6. Handler invoked`,
    lifecycle:
      'Per request multipart parsing — temp files cleaned after request (configurable location).',
    proxy:
      'N/A.',
    runtime:
      'spring.servlet.multipart.max-file-size / max-request-size limits. Part Content-Type must match converter (application/json for DTO).',
    failure:
      'Missing multipart resolver — MultipartException. Wrong part name — MissingServletRequestPartException. JSON part without Content-Type application/json — bind failure.',
    debug:
      'Log part names and Content-Types. curl -F file=@x.pdf -F metadata=@meta.json;type=application/json. TRACE multipart resolver.',
    production:
      'Validate file size/type, virus scan, store to object storage not local disk. Sanitize filename. Rate limit uploads.',
    mistakes: [
      'Using @RequestBody instead of @RequestPart for multipart JSON part',
      'Omitting consumes MULTIPART_FORM_DATA',
      'Part name mismatch with client Content-Disposition name',
      'Expecting @RequestParam to deserialize JSON part to object',
    ],
    traps: [
      'Interview: @RequestPart uses HttpMessageConverter per part; @RequestParam for simple strings',
      'MultipartFile is @RequestPart or @RequestParam — both work for files',
      'WebFlux: Part / FilePart in reactive stack',
      'jakarta.validation @Valid on @RequestPart DTO',
    ],
    answer15s:
      '@RequestPart binds a multipart form part to MultipartFile or DTO via HttpMessageConverter — for file + JSON metadata uploads.',
    answer60s:
      '@RequestPart resolves named multipart parts. MultipartFile for binary; annotated DTO parts deserialized with Jackson when Content-Type application/json. RequestPartMethodArgumentResolver. Requires multipart resolver and consumes MULTIPART_FORM_DATA.',
    answer3m:
      'Resolver pipeline vs @RequestParam. Client must set part Content-Type for JSON. Boot multipart size limits. Security: validate content type, size, auth on upload endpoint. WebFlux Part equivalent. Pitfalls: wrong annotation, missing consumes, part naming. Production object storage pattern.',
    memory: '@REQUEST_PART = multipart part → converter (file or JSON DTO).',
  },
  {
    id: 'webflux-vs-mvc',
    annotation: 'WebFlux request pipeline (vs Spring MVC)',
    family: 'gaps-web-test',
    what:
      'Spring WebFlux (spring-boot-starter-webflux) reactive stack on Reactor (Mono/Flux) — Netty by default, no Servlet API. DispatcherHandler (not DispatcherServlet) dispatches to HandlerMapping → HandlerAdapter → HandlerResultHandler. Spring MVC (spring-boot-starter-web) servlet stack — DispatcherServlet, Tomcat/Jetty, blocking controllers returning objects directly. Boot 3 chooses stack via classpath — both present defaults to MVC.',
    why:
      'Interview and architecture: know when reactive helps (high concurrency I/O bound with non-blocking drivers) vs MVC simplicity (blocking JPA, majority of Spring apps). Annotation model similar (@GetMapping works) but return types differ: Mono<ResponseEntity<T>> vs ResponseEntity<T>.',
    example: `// WebFlux (Netty)
@RestController
@RequestMapping("/api/reactive")
public class ReactiveOrderController {
  @GetMapping("/{id}")
  public Mono<OrderDto> get(@PathVariable String id) {
    return orderService.findById(id); // returns Mono from R2DBC/WebClient
  }
}

// MVC (Servlet)
@RestController
@RequestMapping("/api/mvc")
public class MvcOrderController {
  @GetMapping("/{id}")
  public OrderDto get(@PathVariable Long id) {
    return orderService.findById(id); // blocking JPA
  }
}`,
    processor:
      'WebFlux: DispatcherHandler → RequestMappingHandlerMapping → RequestMappingHandlerAdapter invokes @Controller method returning Publisher → HandlerResultHandler (ResponseEntityResultHandler, RequestResponseBodyResultHandler) subscribes and writes reactive response. Netty event loop threads — never block. MVC: DispatcherServlet → same annotation mapping names but ServletRequestDataBinder, HttpMessageConverter on servlet thread pool.',
    when:
      'WebFlux: streaming, gateway BFF with WebClient, R2DBC, high fan-out I/O. MVC: JPA/Hibernate blocking, most CRUD microservices, simpler debugging. Mixed: WebClient from MVC thread ok; blocking call in WebFlux controller forbidden (blockhound).',
    flow: `WebFlux inbound:
Netty I/O → HttpWebHandlerAdapter → WebFilter chain
→ DispatcherHandler → HandlerMapping → HandlerAdapter
→ Controller returns Mono<OrderDto>
→ ResultHandler subscribes → encodes JSON on event loop
→ backpressure via Reactive Streams

MVC inbound:
Tomcat thread → Filter chain → DispatcherServlet
→ HandlerMapping → RequestMappingHandlerAdapter
→ Controller returns OrderDto (blocking service call)
→ HttpMessageConverter writes response → thread released`,
    lifecycle:
      'WebFlux: reactive pipeline subscription per request. MVC: one servlet thread per request (virtual threads optional Java 21).',
    proxy:
      'Both: @Transactional on WebFlux controller anti-pattern (no thread-bound transaction). AOP on reactive methods requires reactive return types awareness.',
    runtime:
      'Boot spring.main.web-application-type=reactive|servlet|none. WebFlux excludes spring-boot-starter-tomcat, uses Netty. Functional routing RouterFunction alternative to @Controller.',
    failure:
      'block() inside WebFlux controller — stalls event loop. Mixing spring-boot-starter-web + webflux without web-application-type — unexpected stack. JPA in WebFlux thread — blocks event loop.',
    debug:
      'Verify stack: Netty vs Tomcat in logs. Reactor Hooks.onOperatorDebug. MVC: thread dump shows http-nio threads blocked.',
    production:
      'Default MVC unless team owns reactive ops. WebFlux needs non-blocking end-to-end (DB, HTTP clients). Do not choose WebFlux for thread scalability myth alone.',
    mistakes: [
      'Blocking JPA repository in WebFlux controller',
      'Both web and webflux starters without explicit web-application-type',
      'Expecting HttpServletRequest in WebFlux — use ServerWebExchange',
      'Returning Flux without understanding backpressure to slow clients',
    ],
    traps: [
      'Interview: DispatcherHandler vs DispatcherServlet',
      'WebFlux default Netty; MVC default Tomcat',
      'Mono/Flux return types signal reactive adapter',
      '@RestController works on both — infrastructure differs',
    ],
    answer15s:
      'WebFlux uses DispatcherHandler on Netty with Mono/Flux; MVC uses DispatcherServlet on servlet container with blocking return types.',
    answer60s:
      'WebFlux: reactive pipeline, RequestMappingHandlerAdapter handles Publisher return types, WebFilter chain. MVC: servlet filters, blocking controllers, JPA-friendly. Boot 3 classpath deduces web type. Never block event loop in WebFlux.',
    answer3m:
      'Compare stacks: threading model, return types, database drivers (R2DBC vs JDBC). Handler chain names parallel but different classes. WebClient works in both. Security: ServerHttpSecurity vs HttpSecurity. When to choose each. Pitfalls: blocking in reactive, dual starter conflict. Functional endpoints RouterFunction. Production majority MVC; reactive for specific I/O bound cases.',
    memory: 'WEBFLUX = DispatcherHandler + Netty + Mono/Flux; MVC = DispatcherServlet + blocking.',
    tables: [
      {
        headers: ['Aspect', 'Spring MVC', 'WebFlux'],
        rows: [
          ['Entry', 'DispatcherServlet', 'DispatcherHandler'],
          ['Server', 'Tomcat/Jetty (Servlet)', 'Netty (Reactive)'],
          ['Return type', 'Object, ResponseEntity', 'Mono, Flux, ResponseEntity<Mono>'],
          ['Blocking JPA', 'OK', 'Anti-pattern on event loop'],
          ['Security', 'HttpSecurity', 'ServerHttpSecurity'],
        ],
      },
    ],
  },
  {
    id: 'spring-boot-test-overview',
    annotation: '@SpringBootTest (slice testing overview)',
    family: 'gaps-web-test',
    what:
      '@Target(TYPE) loads full Spring Boot application context (or configured slice) for integration tests. Attributes: webEnvironment (MOCK, RANDOM_PORT, DEFINED_PORT, NONE), classes, properties, args, useMainMethod. Meta-test infrastructure: @SpringBootConfiguration, TestContext bootstrapper, context cache. Slice annotations (@WebMvcTest, @DataJpaTest) are specialized subsets — not full @SpringBootTest.',
    why:
      'Verify wiring, auto-configuration, and integration with real (or test) infrastructure. Choose test granularity: full @SpringBootTest slowest but highest fidelity; slices fast, focused, require @MockBean/@Import for collaborators.',
    example: `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = Replace.NONE) // use Testcontainers Postgres
class PaymentFlowIT {
  @Autowired TestRestTemplate rest;

  @Test
  void capturePayment() {
    ResponseEntity<PaymentDto> res =
        rest.postForEntity("/api/v1/payments", request, PaymentDto.class);
    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
  }
}`,
    processor:
      'SpringBootTestContextBootstrapper builds merged @ContextConfiguration from @SpringBootApplication test class or @SpringBootTest classes attribute. SpringBootContextLoader loads ApplicationContext with test @TestPropertySource / @DynamicPropertySource overrides. ContextCustomizerFactory chain applies @MockBean, @SpyBean, @DynamicPropertySource before refresh.',
    when:
      'End-to-end integration tests, contract tests with full stack. Use slices when testing one layer. webEnvironment.RANDOM_PORT for @LocalServerPort real HTTP.',
    flow: `Test bootstrap:
1. JUnit Jupiter extension / SpringRunner starts TestContext
2. SpringBootTestContextBootstrapper resolves configuration classes
3. ContextCustomizer: DynamicPropertySource, MockBean definitions
4. ApplicationContext refresh (full or slice)
5. Test method @Autowired dependencies
6. Context cached by MergedContextConfiguration key for reuse`,
    lifecycle:
      'Test ApplicationContext cached across test class — dirty context on @DirtiesContext. @Transactional test rolls back DB by default.',
    proxy:
      'Full context includes real @Transactional proxies on services. Slices may exclude service layer — mocks instead.',
    runtime:
      'Test slices exclude auto-config via @AutoConfigure* and ImportAutoConfiguration selective imports. @SpringBootTest without webEnvironment.NONE starts mock or real web server.',
    failure:
      'Context failed to load — missing bean, wrong profile. Slow suite — too many full @SpringBootTest. Flaky — shared mutable state without @DirtiesContext.',
    debug:
      'logging.level.org.springframework.test.context=DEBUG. Context failure report shows missing bean. Reduce scope to slice to isolate.',
    production:
      'Test pyramid: many unit, fewer slice, few full IT. Testcontainers for real DB/Kafka in IT. Parallel test execution watch context cache.',
    mistakes: [
      'Using @SpringBootTest for every test — slow CI',
      'Full context when @WebMvcTest suffices',
      'Not using @ActiveProfiles("test")',
      'Shared static mutable state across tests',
    ],
    traps: [
      'Interview: slice tests import subset via @ImportAutoConfiguration',
      'webEnvironment MOCK = MockMvc no real port; RANDOM_PORT = embedded server',
      'Context cache key includes properties and mock beans',
      '@SpringBootTest does not replace unit tests',
    ],
    answer15s:
      '@SpringBootTest loads Boot integration test context; slice annotations load focused subsets for faster layer tests.',
    answer60s:
      '@SpringBootTest full application context with webEnvironment options. Slices (@WebMvcTest, @DataJpaTest) import selective auto-config. ContextCustomizer applies @DynamicPropertySource and @MockBean before refresh. Choose slice for speed.',
    answer3m:
      'Bootstrap: SpringBootTestContextBootstrapper, context caching, customizers. webEnvironment modes. Contrast slices: MVC layer, JPA layer, JSON tests. Testcontainers + @DynamicPropertySource pattern. @Transactional rollback. Pitfalls: slow tests, missing mocks in slices. Boot 3 @MockitoBean migration. Production CI strategy.',
    memory: '@SPRING_BOOT_TEST = full IT context; prefer slices for speed.',
  },
  {
    id: 'web-mvc-test',
    annotation: '@WebMvcTest',
    family: 'gaps-web-test',
    what:
      '@Target(TYPE) Boot test slice loading Spring MVC components only — @Controller, @ControllerAdvice, Jackson, Validation, MockMvc — without full service/repository context. Auto-configures MockMvc and imports WebMvc-related AutoConfiguration via @ImportAutoConfiguration. Use @MockBean for @Service dependencies injected into controllers.',
    why:
      'Fast controller-layer tests: verify mapping, status codes, JSON serialization, validation errors, @ControllerAdvice — without starting full database or Kafka. Isolates web layer contract.',
    example: `@WebMvcTest(OrderController.class)
class OrderControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean OrderService orderService;

  @Test
  void getOrder() throws Exception {
    when(orderService.findById(1L)).thenReturn(new OrderDto(1L, "OPEN"));
    mockMvc.perform(get("/api/v1/orders/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("OPEN"));
  }
}`,
    processor:
      'WebMvcTestContextBootstrapper extends SpringBootTestContextBootstrapper — limits component scan to @WebMvcTest controllers attribute (or all @Controller if empty). Excludes @Service/@Repository unless @Import. AutoConfigureWebMvc imports MockMvc, Jackson, validation. MockitoPostProcessor registers @MockBean replacements in test context.',
    when:
      'REST controller unit/integration at web layer. Security tests with @AutoConfigureMockMvc(addFilters = false) or @Import(SecurityConfig.class). Not for @Repository or @Transactional service logic.',
    flow: `1. @WebMvcTest(OrderController.class) starts slice context
2. OrderController real bean; OrderService @MockBean
3. MockMvc performs HTTP against MockMvc standalone setup
4. DispatcherServlet invokes real controller
5. Mocked service returns stub data
6. JSON asserted via jsonPath`,
    lifecycle:
      'Lightweight context per MergedContextConfiguration — faster refresh than @SpringBootTest.',
    proxy:
      'Controller real instance — not mocked. @Transactional not active on mocked services. SecurityFilterChain may be partial — @WithMockUser.',
    runtime:
      'Does not start embedded server unless combined — uses MockMvc internal DispatcherServlet. @AutoConfigureMockMvc customizes builders.',
    failure:
      'UnsatisfiedDependencyException — forgot @MockBean for service dependency. Bean not found — security config missing @Import. Wrong — testing repository with @WebMvcTest.',
    debug:
      'Context failure: which dependency missing. @MockBean name/type mismatch. Print MockMvc response content on failure.',
    production:
      'Primary tool for API contract tests in CI. Pair with separate @DataJpaTest / IT for persistence.',
    mistakes: [
      'Expecting @Transactional rollback on real service — service is mock',
      'Missing @MockBean for constructor-injected dependencies',
      'Including @SpringBootApplication — loads too much, use @WebMvcTest only',
      'Testing JPA queries in @WebMvcTest',
    ],
    traps: [
      'Interview: @WebMvcTest = MVC slice + MockMvc + @MockBean services',
      'Only controllers under test loaded — not full scan',
      '@AutoConfigureMockMvc security addFilters false for isolated controller test',
      'jsonPath vs @WebTestClient in WebFlux slice @WebFluxTest',
    ],
    answer15s:
      '@WebMvcTest loads MVC slice with MockMvc and mocks service dependencies via @MockBean — tests controllers in isolation.',
    answer60s:
      '@WebMvcTest imports WebMvc auto-config, instantiates specified @Controller beans, @MockBean for collaborators. MockMvc performs requests without full context. Fast controller tests including validation and exception handlers.',
    answer3m:
      'Bootstrap: WebMvcTestContextBootstrapper, ImportAutoConfiguration subset. @MockBean MockitoPostProcessor. Security testing @WithMockUser. Contrast @SpringBootTest RANDOM_PORT. @WebFluxTest reactive equivalent. Pitfalls: missing mocks, expecting TX, loading full app. jsonPath, content().json. Production: controller test suite in CI.',
    memory: '@WEB_MVC_TEST = MVC slice + MockMvc + @MockBean services.',
  },
  {
    id: 'data-jpa-test',
    annotation: '@DataJpaTest',
    family: 'gaps-web-test',
    what:
      '@Target(TYPE) JPA test slice — configures in-memory or test DataSource, JPA EntityManager, Spring Data repositories, @Transactional rollback by default. Imports JpaRepositoriesAutoConfiguration subset. Does NOT load @WebMvcTest or @Service beans unless @Import. @AutoConfigureTestDatabase replaces DataSource with embedded H2 by default.',
    why:
      'Test repository query methods, @Query JPQL, entity mappings, auditing — without web layer or full application startup. Faster than @SpringBootTest with real focus on persistence.',
    example: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(OrderService.class) // only if testing service+repo together — usually avoid
class PaymentRepositoryTest {
  @Autowired PaymentRepository repo;
  @Autowired TestEntityManager em;

  @Test
  void findByStatus() {
    em.persist(new Payment("P1", PaymentStatus.CAPTURED));
    assertThat(repo.findByStatus(PaymentStatus.CAPTURED)).hasSize(1);
  }
}`,
    processor:
      'DataJpaTestContextBootstrapper limits scan to @Entity and @Repository (Spring Data interfaces). AutoConfigureDataJpa imports DataSource, JpaBaseConfiguration, Hibernate. TestEntityManager @Autowired for persist/flush. @Transactional on test class — default rollback after each test method.',
    when:
      'Repository layer tests, custom @Query verification, entity constraint tests. Use Testcontainers + @DynamicPropertySource for Postgres-specific SQL instead of H2 when dialect matters.',
    flow: `1. @DataJpaTest starts minimal JPA context
2. Embedded H2 or Testcontainers DataSource
3. Spring Data factory creates repository proxies
4. Test @Transactional begins
5. TestEntityManager persist + repository query
6. Test ends — rollback (default)`,
    lifecycle:
      'Each test method transactional rollback unless @Commit or @Rollback(false).',
    proxy:
      'Spring Data repository JDK dynamic proxy — real JPA queries against test DB.',
    runtime:
      '@AutoConfigureTestDatabase Replace.NONE keeps application.yml DataSource — for Testcontainers. flyway/liquibase may need @AutoConfigureTestDatabase + @Import.',
    failure:
      'H2 vs Postgres dialect mismatch — false green tests. LazyInitializationException if accessing lazy outside TX without fetch join. Missing @Entity scan — empty context.',
    debug:
      'spring.jpa.show-sql=true in test properties. TestEntityManager flush() before query assertions. logging.level.org.hibernate.SQL=DEBUG.',
    production:
      'Prefer Testcontainers real DB for CI integration tests matching prod dialect. Keep @DataJpaTest focused on repositories not full workflows.',
    mistakes: [
      'Testing controller in @DataJpaTest — wrong slice',
      'Assuming H2 validates Postgres-specific @Query',
      'Forgetting flush() before native query assertions',
      '@Import entire @SpringBootApplication — defeats slice purpose',
    ],
    traps: [
      'Interview: @DataJpaTest = JPA + repositories + @Transactional rollback',
      'TestEntityManager bean available for setup',
      'Replace.NONE + Testcontainers common pattern',
      'Does not load @WebMvcTest controllers',
    ],
    answer15s:
      '@DataJpaTest is JPA slice with test DataSource, repositories, TestEntityManager, and default @Transactional rollback.',
    answer60s:
      '@DataJpaTest imports JPA auto-config only. Tests Spring Data repositories against embedded or Testcontainers DB. @Transactional rolls back after each test. Use TestEntityManager for test data setup.',
    answer3m:
      'Bootstrap: DataJpaTestContextBootstrapper, limited component scan. H2 default vs Testcontainers + DynamicPropertySource. Repository proxy real queries. Pitfalls: dialect mismatch, lazy loading, importing too many beans. Contrast @WebMvcTest and @SpringBootTest. @Sql for fixtures. Production CI with real DB container.',
    memory: '@DATA_JPA_TEST = JPA slice + repos + TX rollback.',
  },
  {
    id: 'mockbean-mockitobean',
    annotation: '@MockBean · @MockitoBean',
    family: 'gaps-web-test',
    what:
      '@MockBean (spring-boot-test): replaces or adds bean in test ApplicationContext with Mockito mock. @MockitoBean (spring-test, Boot 3.4+): bean override API in org.springframework.test.context.bean.override.mockito — preferred successor using @BeanOverride infrastructure. Both integrate with Spring TestContext — mock injected into @Autowired subject under test. @SpyBean / @MockitoSpyBean for partial mocks.',
    why:
      'Slice tests need collaborators mocked (@WebMvcTest service deps). Integration tests isolate external systems (payment gateway, Kafka). Context must contain mock bean definition so @Autowired constructor injection resolves.',
    example: `@WebMvcTest(OrderController.class)
class OrderControllerMockTest {
  @MockBean OrderService orderService; // Boot classic

  @Autowired MockMvc mockMvc;
}

// Boot 3.4+ style
@WebMvcTest(OrderController.class)
class OrderControllerMockitoBeanTest {
  @MockitoBean OrderService orderService;

  @Autowired MockMvc mockMvc;
}`,
    processor:
      '@MockBean: MockitoPostProcessor (Boot) registers BeanDefinition override before context refresh — removes or replaces existing bean by type/name. @MockitoBean: BeanOverrideProcessor in spring-test registers override metadata scanned from test class fields. Both produce Mockito mock injected as singleton in test context.',
    when:
      '@WebMvcTest/@DataJpaTest collaborator mocking. @SpringBootTest when replacing remote client with mock. Migrate new tests to @MockitoBean on Boot 3.4+.',
    flow: `1. Test class declares @MockBean PaymentClient
2. ContextCustomizer processes mock before refresh
3. Existing PaymentClient BeanDefinition replaced
4. Context refresh creates Mockito mock bean
5. OrderService @Autowired PaymentClient receives mock
6. when(...).thenReturn(...) in test method`,
    lifecycle:
      'Mock bean lives for test ApplicationContext cache lifetime — reset Mockito between tests with @AfterEach or automatic reset policies.',
    proxy:
      'Mock replaces real bean — no CGLIB on mock. @Transactional on real service lost when service mocked in @WebMvcTest.',
    runtime:
      '@MockBean by type replaces single bean — ambiguous if multiple same type without @Qualifier on mock field. @MockitoBean supports name attribute in override API.',
    failure:
      'NoUniqueBeanDefinitionException — multiple beans, mock does not disambiguate. @MockBean on class used in production context by mistake. Condition @ConditionalOnMissingBean satisfied by mock hiding missing prod bean.',
    debug:
      'Context failure: which bean cannot be created. Verify mock type matches injected interface. Actuator /beans in test context if enabled.',
    production:
      'Test-only annotations — never in main sources. Document migration Boot 3.4 @MockitoBean. Limit mocks — integration tests may need real beans.',
    mistakes: [
      'Multiple @MockBean same type without @Qualifier',
      '@MockBean in src/main/java',
      'Expecting real @Transactional on mocked @Service',
      'Forgetting to stub mock method — returns null',
    ],
    traps: [
      'Interview: @MockBean replaces bean in test context via MockitoPostProcessor',
      '@MockitoBean Boot 3.4+ bean override successor',
      '@MockBean satisfies @ConditionalOnMissingBean in tests — false confidence',
      'Contrast @Mock (MockitoJUnit Jupiter) — no Spring context',
    ],
    answer15s:
      '@MockBean and @MockitoBean inject Mockito mocks as Spring beans in tests, replacing real collaborators in the test context.',
    answer60s:
      '@MockBean (Boot) and @MockitoBean (spring-test 6.2+/Boot 3.4+) register mock BeanDefinitions before context refresh. Used in @WebMvcTest for service mocks. Differs from plain @Mock — requires Spring context integration.',
    answer3m:
      'Mechanism: ContextCustomizer / BeanOverrideProcessor replaces definitions. Type vs name targeting. @SpyBean partial mock. Pitfalls: ambiguity, conditional beans, missing stubs. Migration to @MockitoBean. vs @Mock unit test without context. @Primary interaction. Production: test code only.',
    memory: '@MOCK_BEAN / @MOCKITO_BEAN = Spring context Mockito replacement.',
    tables: [
      {
        headers: ['Annotation', 'Module', 'Boot version', 'Notes'],
        rows: [
          ['@MockBean', 'spring-boot-test', 'All Boot 3', 'Classic; MockitoPostProcessor'],
          ['@MockitoBean', 'spring-test', 'Boot 3.4+', 'Bean override API successor'],
          ['@SpyBean', 'spring-boot-test', 'Boot 3', 'Partial real behavior'],
          ['@Mock', 'mockito-junit-jupiter', 'N/A', 'No Spring context'],
        ],
      },
    ],
  },
  {
    id: 'dynamic-property-source',
    annotation: '@DynamicPropertySource',
    family: 'gaps-web-test',
    what:
      '@Target(METHOD) static method on test class registering dynamic properties via DynamicPropertyRegistry before ApplicationContext refresh. Typical pattern: Testcontainers PostgreSQL/Kafka start in @BeforeAll, container.getHost()/getMappedPort() registered as spring.datasource.url etc. Spring Framework 5.2.5+ / Boot 2.2.5+.',
    why:
      'Integration tests need real infrastructure with random ports — cannot hardcode URLs in application-test.yml. @DynamicPropertySource runs after static container start, before context loads properties.',
    example: `@SpringBootTest
@Testcontainers
class OrderIT {
  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  @DynamicPropertySource
  static void registerProps(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("spring.kafka.bootstrap-servers",
        () -> kafka.getBootstrapServers());
  }
}`,
    processor:
      'DynamicPropertyRegistryContextCustomizer (ContextCustomizerFactory) invokes static @DynamicPropertySource methods before context refresh, adding PropertySource with highest precedence for test keys. Supplier evaluated lazily when property read — supports late container port binding.',
    when:
      'Testcontainers, embedded servers with random ports, per-test JVM system property injection. Alternative: @TestPropertySource for static values only.',
    flow: `1. JUnit starts @Container static PostgreSQLContainer
2. container.start() in BeforeAll (Testcontainers extension)
3. Spring TestContext prepares MergedContextConfiguration
4. DynamicPropertyRegistryContextCustomizer calls registerProps
5. registry.add("spring.datasource.url", postgres::getJdbcUrl)
6. ApplicationContext refresh binds DataSource to container URL`,
    lifecycle:
      'Properties active for life of test context. Container stopped @AfterAll — context must not reconnect after stop in same JVM without restart.',
    proxy:
      'N/A — Environment property injection.',
    runtime:
      'Method must be static. Multiple @DynamicPropertySource methods allowed across hierarchy. Supplier<String> for dynamic values.',
    failure:
      'Non-static method — IllegalStateException. Container not started before registry — connection refused. Typo in property key — auto-config uses wrong DataSource.',
    debug:
      'Log registry.add keys at test startup. Verify jdbcUrl in failed test context output. @Autowired Environment.getProperty in test.',
    production:
      'CI runs Testcontainers with Docker socket. Ryuk container cleanup. Reuse containers across test class for speed (.withReuse(true) local only).',
    mistakes: [
      'Instance @DynamicPropertySource method',
      'Registering properties after context already cached without @DirtiesContext',
      'Hardcoding port instead of Supplier lambda',
      'Forgetting dynamic kafka bootstrap with multiple brokers',
    ],
    traps: [
      'Interview: @DynamicPropertySource runs BEFORE context refresh',
      'Testcontainers standard companion annotation',
      'Supplier lazy evaluation — port available when read',
      'Higher precedence than application-test.yml',
    ],
    answer15s:
      '@DynamicPropertySource static method registers dynamic test properties via DynamicPropertyRegistry before Spring context refresh — common with Testcontainers.',
    answer60s:
      '@DynamicPropertySource adds properties programmatically before context load. DynamicPropertyRegistryContextCustomizer invokes static method. Testcontainers JDBC/Kafka URLs registered with Supplier lambdas. Overrides application-test.properties.',
    answer3m:
      'Ordering: container start → dynamic properties → context refresh. Testcontainers pattern in microservice IT. vs @TestPropertySource static files. vs @Value cannot change after refresh. Pitfalls: non-static, container lifecycle, context cache stale. Boot 3 unchanged. CI Docker requirements.',
    memory: '@DYNAMIC_PROPERTY_SOURCE = static registry → props before context.',
  },
  {
    id: 'sql-test',
    annotation: '@Sql',
    family: 'gaps-web-test',
    what:
      '@Target(TYPE|METHOD) executes SQL scripts against configured DataSource during test lifecycle. Attributes: scripts/value, statements (inline), executionPhase (BEFORE_TEST_METHOD, AFTER_TEST_METHOD, BEFORE_TEST_CLASS, AFTER_TEST_CLASS), config @SqlConfig (separator, encoding, dataSource, transactionMode). Spring Test SqlScriptsTestExecutionListener orchestrates execution.',
    why:
      'Seed reference data for integration tests without Java setup boilerplate. Reset tables between tests with cleanup scripts. Complement @DataJpaTest @Transactional rollback — understand interaction.',
    example: `@SpringBootTest
@Sql(scripts = "/sql/schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class ReportIT {

  @Test
  @Sql(scripts = "/sql/orders-fixture.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
  @Sql(scripts = "/sql/cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
  void generatesReport() {
    // orders-fixture.sql data visible
  }
}`,
    processor:
      'SqlScriptsTestExecutionListener (TestExecutionListener) intercepts test class/method lifecycle hooks. ResourceDatabasePopulator or ScriptUtils executes scripts via DataSource. @SqlConfig transactionMode INFERRED/DEFAULT participates in test transaction when @Transactional present.',
    when:
      'Reference data fixtures, complex SQL setup easier than Java builders. AFTER_TEST_METHOD cleanup when not relying solely on rollback.',
    flow: `1. BEFORE_TEST_METHOD: SqlScriptsTestExecutionListener runs orders-fixture.sql
2. Test @Transactional may start
3. Test method queries DB with seeded data
4. Test method ends — @Transactional rollback (default)
5. AFTER_TEST_METHOD: cleanup.sql runs
Note: rollback may undo BEFORE_TEST_METHOD data inserted in same transaction`,
    lifecycle:
      'Per executionPhase timing relative to test transaction boundaries.',
    proxy:
      'N/A.',
    runtime:
      'Script paths classpath: or file:. @Sql merges class-level and method-level. @SqlMergeMode overrides default merge behavior (Boot 2.5+).',
    failure:
      '@Transactional test rolls back @Sql BEFORE_TEST_METHOD data before assertion — classic flake. Script syntax error — ScriptStatementFailedException. Wrong DataSource bean in multi-DS app.',
    debug:
      'logging.level.org.springframework.jdbc.datasource.init=DEBUG. Disable @Transactional temporarily to verify script data. Use BEFORE_TEST_METHOD + @Commit for persistent fixture tests.',
    production:
      'Prefer Flyway/Liquibase for schema; @Sql for test-only fixtures. Keep scripts idempotent where possible.',
    mistakes: [
      '@Sql + @Transactional rollback hides fixture data',
      'Assuming AFTER runs after rollback — order matters',
      'Non-idempotent scripts causing duplicate key on second test',
      'Wrong executionPhase for class-level expensive setup',
    ],
    traps: [
      'Interview: @Sql + @Transactional rollback interaction — data may not be visible',
      'SqlScriptsTestExecutionListener executes scripts',
      'Use @Commit or NOT_SUPPORTED transaction for fixture persistence',
      '@SqlConfig(transactionMode = ISOLATED) for separate TX',
    ],
    answer15s:
      '@Sql runs SQL scripts around tests via SqlScriptsTestExecutionListener; watch @Transactional rollback interaction.',
    answer60s:
      '@Sql scripts at BEFORE/AFTER test method or class phases. SqlScriptsTestExecutionListener populates DataSource. @Transactional default rollback may undo BEFORE_TEST_METHOD inserts in same transaction — use @SqlConfig or @Commit.',
    answer3m:
      'Phases: BEFORE_TEST_CLASS for schema once, BEFORE_TEST_METHOD for data. Transaction modes: INFERRED vs ISOLATED. Pitfalls: rollback undoing fixtures, cleanup order. vs TestEntityManager in @DataJpaTest. vs Flyway for migrations. Production: test resources only.',
    memory: '@SQL = script fixtures; mind @Transactional rollback trap.',
  },
  {
    id: 'validated-constraint',
    annotation: '@Validated (groups) · @Constraint (custom composition)',
    family: 'gaps-web-test',
    what:
      '@Validated: Spring class/method annotation enabling method-level validation and validation groups (class-level on @Controller triggers @Valid on @RequestParam/@PathVariable when combined). jakarta.validation @Constraint on custom annotation composes validation logic via ConstraintValidator. Boot 3 uses jakarta.validation (Hibernate Validator). Groups: interfaces tagging constraints (Create.class, Update.class).',
    why:
      'Different validation rules for create vs update (id must be null on create). Reusable domain constraints (@ValidPaymentId) as composed annotations. Method-level @Validated on service enforces @NotNull on parameters beyond DTO boundary.',
    example: `public interface OnCreate {}
public interface OnUpdate {}

public class OrderRequest {
  @Null(groups = OnCreate.class)
  @NotNull(groups = OnUpdate.class)
  private Long id;

  @NotBlank(groups = {OnCreate.class, OnUpdate.class})
  private String customerId;
}

@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
@Constraint(validatedBy = PaymentIdValidator.class)
@NotBlank
@Pattern(regexp = "pay_[a-z0-9]{8}")
public @interface ValidPaymentId {
  String message() default "Invalid payment id";
  Class<?>[] groups() default {};
  Class<? extends Payload>[] payload() default {};
}

@RestController
@Validated
public class OrderController {
  @PostMapping
  public OrderDto create(@Validated(OnCreate.class) @RequestBody OrderRequest req) { /* ... */ }
}`,
    processor:
      '@Valid on @RequestBody: RequestResponseBodyMethodProcessor validates via Validator (LocalValidatorFactoryBean) before controller invoke. @Validated on class: MethodValidationInterceptor (AOP) validates method parameters and return values on @Service/@Controller. Custom @Constraint: ConstraintValidatorFactory creates PaymentIdValidator, isValid() called during validation pass. Composed constraints: Hibernate Validator reads meta-constraints (@NotBlank + @Pattern on @ValidPaymentId).',
    when:
      'Create/update DTO groups. Custom cross-field validation in ConstraintValidator. @Validated on @Service for defensive parameter checks. @Valid on nested objects with @Valid cascade.',
    flow: `POST /orders with @Validated(OnCreate.class):
1. Jackson deserializes OrderRequest
2. RequestResponseBodyMethodProcessor invokes Validator
3. Only constraints in OnCreate group evaluated
4. Violations → MethodArgumentNotValidException → 400 ProblemDetail
5. Custom @ValidPaymentId: PaymentIdValidator.isValid()
6. Success → controller method runs`,
    lifecycle:
      'Validation at method entry per request. ConstraintValidator instances may be CDI/Spring beans if injected via SpringConstraintValidatorFactory.',
    proxy:
      '@Validated on @Service triggers MethodValidationInterceptor advisor — JDK/CGLIB proxy validates before target method.',
    runtime:
      'GroupDefault if no group specified. Custom message interpolators. @Validated without groups on parameter uses Default group only.',
    failure:
      'Groups ignored — forgot @Validated(Group) on parameter. Custom validator not Spring bean — cannot @Autowired dependencies without factory config. Method validation not triggered without @Validated on class.',
    debug:
      'logging.level.org.hibernate.validator=DEBUG. HandlerMethodValidationException (Boot 3.2+) for method validation. Assert binding result field errors in MockMvc.',
    production:
      'Consistent ProblemDetail error responses via @ControllerAdvice. Document group interfaces. Keep validators stateless or scoped carefully.',
    mistakes: [
      'Using @Valid only without groups on create/update same DTO',
      '@Validated on class missing for method param validation',
      'ConstraintValidator with DB call without considering performance',
      'Composed @Constraint missing @Constraint meta on container annotation',
    ],
    traps: [
      'Interview: @Valid triggers Bean Validation; @Validated enables Spring method validation + groups',
      'Groups require @Validated(OnCreate.class) on parameter',
      'Composed constraint: meta-annotations @NotBlank @Pattern on custom @interface',
      'jakarta.validation not javax.validation on Boot 3',
    ],
    answer15s:
      '@Validated enables validation groups and method-level checks; custom @Constraint composes validators via ConstraintValidator.',
    answer60s:
      '@Validated(OnCreate.class) on @RequestBody applies group-specific constraints. @Validated on @Controller/@Service enables MethodValidationInterceptor. Custom @Constraint with ConstraintValidator; compose with meta-constraints like @NotBlank.',
    answer3m:
      'Groups: marker interfaces, selective constraint activation. Custom validator: ConstraintValidator<A,T>, SpringConstraintValidatorFactory for DI. Method vs object validation paths. MockMvc csrf and validation error jsonPath. Composed annotations reduce boilerplate. Boot 3 jakarta.validation. Pitfalls: missing @Validated on class, wrong group, javax import. Production ProblemDetail.',
    memory: '@VALIDATED = groups + method validation; @CONSTRAINT = custom validator compose.',
    tables: [
      {
        headers: ['Trigger', 'Annotation', 'What validates'],
        rows: [
          ['Request body', '@Valid / @Validated', 'DTO fields'],
          ['Groups', '@Validated(OnCreate.class)', 'Subset of constraints'],
          ['Service method', '@Validated on class', 'Method params/return'],
          ['Custom rule', '@Constraint + Validator', 'isValid() logic'],
        ],
      },
    ],
  },
];
