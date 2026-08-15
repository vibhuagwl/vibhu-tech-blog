import type {AnnotationCard} from './types';

export const WEB: AnnotationCard[] = [
  {
    id: 'request-mapping',
    annotation: '@RequestMapping · @GetMapping · @PostMapping',
    family: 'web',
    what:
      '@RequestMapping on class/method maps HTTP requests to handler methods. Composed annotations: @GetMapping, @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping (meta-annotated @RequestMapping with method attribute). Attributes: path/value, method, params, headers, consumes, produces, name. @RestController = @Controller + @ResponseBody on class.',
    why:
      'Declarative URL routing for Spring MVC. Narrow mappings reduce ambiguity in HandlerMapping lookup. produces/consumes for content negotiation (application/json vs xml).',
    example: `@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

  @GetMapping("/{id}")
  public OrderDto get(@PathVariable Long id) {
    return orderService.findById(id);
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
    OrderDto created = orderService.create(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping(params = "status", path = "/search")
  public List<OrderDto> search(@RequestParam OrderStatus status) {
    return orderService.findByStatus(status);
  }
}`,
    processor:
      'RequestMappingHandlerMapping (implements HandlerMapping) at startup scans @Controller/@RequestMapping metadata via RequestMappingHandlerMapping.detectHandlerMethods. Builds RequestMappingInfo (path patterns, methods, headers). On request: getHandler returns HandlerExecutionChain (handler method + interceptors). Spring MVC 6 / Boot 3 uses PathPatternParser (PathPattern) not AntPathMatcher by default.',
    when:
      'All HTTP endpoints. Prefer composed @GetMapping over @RequestMapping(method=GET). Class-level @RequestMapping for shared prefix. Version APIs in path (/api/v1).',
    flow: `DispatcherServlet → HandlerMapping chain:
1. HTTP GET /api/v1/orders/42 arrives at DispatcherServlet (Front Controller)
2. HandlerMapping implementations tried in order — RequestMappingHandlerMapping matches
3. RequestMappingInfo matches path /api/v1/orders/{id} + GET
4. HandlerMethod resolved: OrderController.get(Long id)
5. HandlerAdapter (RequestMappingHandlerAdapter) invokes with resolved args
6. Return value → ReturnValueHandler → HttpMessageConverter writes JSON`,
    lifecycle:
      'Handler mappings registered once at context refresh. Live reload in dev with spring-boot-devtools. PathPattern compiled at startup.',
    proxy:
      'Controllers are typically concrete @RestController beans — not interface JDK proxies unless @Transactional on controller (anti-pattern). CGLIB subclass if advised.',
    runtime:
      'DispatcherServlet mapped to / by default (Boot). context-path and servlet-path prefix paths. basePath in Next.js unrelated — this is Spring MVC servlet container.',
    failure:
      '404 No handler — path typo, missing @RestController, wrong HTTP method. 405 Method Not Allowed — GET on POST-only mapping. Ambiguous mapping — two methods same pattern.',
    debug:
      'logging.level.org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping=TRACE at startup lists all mappings. /actuator/mappings (Boot). DEBUG DispatcherServlet logs handler resolution.',
    production:
      'Consistent API versioning. Document produces/consumes. Avoid overly broad @RequestMapping without method on class + method-level verbs. Rate limit at gateway.',
    mistakes: [
      'Missing @RestController/@ResponseBody — view name resolution 404',
      'Duplicate mapping paths across controllers',
      '@RequestMapping without HTTP method on method — matches all verbs unexpectedly',
      'Forgetting context-path in client URLs',
    ],
    traps: [
      'Interview flow: DispatcherServlet → HandlerMapping → HandlerAdapter → ReturnValueHandler → HttpMessageConverter',
      '@RestController implies @ResponseBody on all methods',
      'PathPattern {id} vs {*path} catch-all (SF 6)',
      'Trailing slash matching configurable (usePathPattern)',
    ],
    answer15s:
      '@GetMapping etc. map HTTP requests to controller methods via RequestMappingHandlerMapping. DispatcherServlet dispatches to HandlerMethod then serializes response.',
    answer60s:
      'Composed @RequestMapping annotations register RequestMappingInfo with path, method, consumes, produces. At request time RequestMappingHandlerMapping selects HandlerMethod. RequestMappingHandlerAdapter resolves @PathVariable/@RequestParam/@RequestBody args and invokes. Return value handled by RequestResponseBodyMethodProcessor → MappingJackson2HttpMessageConverter.',
    answer3m:
      'Startup: detectHandlerMethods scans @Controller beans. Request: DispatcherServlet.doDispatch → getHandler → getHandlerAdapter → invoke. Mapping attributes: path, method, headers, params, consumes, produces. @RestController stacks @Controller + @ResponseBody. Pitfalls: ambiguous mappings, wrong verb, missing produces. API design: resource nouns, plural paths, proper status codes via ResponseEntity.',
    memory: 'MAPPING: DispatcherServlet → HandlerMapping → HandlerAdapter → converter.',
    tables: [
      {
        headers: ['Annotation', 'HTTP method', 'Typical use'],
        rows: [
          ['@GetMapping', 'GET', 'Read, idempotent'],
          ['@PostMapping', 'POST', 'Create, non-idempotent'],
          ['@PutMapping', 'PUT', 'Full replace'],
          ['@PatchMapping', 'PATCH', 'Partial update'],
          ['@DeleteMapping', 'DELETE', 'Remove'],
        ],
      },
    ],
  },
  {
    id: 'path-variable',
    annotation: '@PathVariable',
    family: 'web',
    what:
      '@Target(PARAMETER) binds URI template variable from @RequestMapping path to method parameter. Attributes: name/value, required (default true). Path segment {id} maps to @PathVariable Long id. Supports type conversion via ConversionService.',
    why:
      'RESTful resource identifiers in URL path — /orders/42 not /orders?id=42. Clean URLs, cacheable GETs, gateway routing rules.',
    example: `@GetMapping("/accounts/{accountId}/transactions/{txnId}")
public TransactionDto getTransaction(
    @PathVariable("accountId") Long accountId,
    @PathVariable String txnId) {
  return txnService.get(accountId, txnId);
}`,
    processor:
      'RequestMappingHandlerAdapter invokes ServletRequestDataBinder pipeline. PathVariableMethodArgumentResolver (implements HandlerMethodArgumentResolver) extracts URI variables from RequestPath / PathPattern match, converts String → target type via ConversionService.',
    when:
      'Resource identity in path. required=false rare — use Optional<Long> or nullable wrapper. Multiple @PathVariable on same method.',
    flow: `1. PathPattern match /accounts/123/transactions/abc-def
2. URI template variables: accountId=123, txnId=abc-def
3. PathVariableMethodArgumentResolver supportsParameter(@PathVariable)
4. resolveArgument: lookup variable, convert to Long/String
5. Inject into handler method`,
    lifecycle:
      'Per-request resolution. Conversion errors before handler invoke.',
    proxy:
      'N/A — argument resolution layer, not AOP.',
    runtime:
      'URL decode applied. Special characters in path segments need encoding. Regex constraints via {id:\\d+} in PathPattern.',
    failure:
      'MissingVariableException — required path var absent. TypeMismatchException — id=abc for Long. 404 if no mapping matches path pattern.',
    debug:
      'Log resolved @PathVariable values at controller entry. TRACE HandlerMethodArgumentResolver chain.',
    production:
      'Validate format in path pattern when possible. Use UUID strings for external ids. Avoid sensitive data in paths (logged by proxies).',
    mistakes: [
      'Parameter name mismatch without -parameters compile flag and without explicit @PathVariable("name")',
      'Wrong type — Date without formatter',
      'Encoding issues with special chars',
    ],
    traps: [
      'Interview: PathVariableMethodArgumentResolver in argument resolver chain',
      'name attribute required if param name not retained in bytecode',
      'PathPattern regex: {id:\\d+}',
      'Contrast @RequestParam for query string',
    ],
    answer15s:
      '@PathVariable binds URI template {name} from path to method parameter. Resolved by PathVariableMethodArgumentResolver with type conversion.',
    answer60s:
      '@PathVariable maps path segment to parameter. RequestMappingHandlerAdapter asks HandlerMethodArgumentResolver chain; PathVariableMethodArgumentResolver extracts from matched PathPattern URI variables and converts via ConversionService. Explicit name if parameter names not available.',
    answer3m:
      'Resolution order among resolvers: PathVariable, RequestParam, RequestBody, etc. Conversion: String to Long, UUID, enums via converters. Optional @PathVariable required=false. Path design: nouns, hierarchical resources. vs @RequestParam: path identity vs filter/pagination query. Failure modes: 400 type mismatch, 404 no mapping.',
    memory: '@PATH_VARIABLE = URI template segment → param; PathVariableMethodArgumentResolver.',
  },
  {
    id: 'request-param',
    annotation: '@RequestParam',
    family: 'web',
    what:
      '@Target(PARAMETER) binds query parameter (?key=value), form field, or multipart part to method parameter. Attributes: name/value, required (default true), defaultValue. Supports arrays, List, Map for repeated keys. Optional via required=false or Optional<T>.',
    why:
      'Filters, pagination, sorting, optional flags — ?status=OPEN&page=2&size=20. defaultValue for optional params without null checks.',
    example: `@GetMapping("/orders")
public Page<OrderDto> listOrders(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) OrderStatus status,
    @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {
  return orderService.findAll(page, size, status, sort);
}`,
    processor:
      'RequestParamMethodArgumentResolver resolves query and form parameters from ServletRequest.getParameter*. defaultValue implies required=false. MultipartResolver path for file uploads with same annotation on MultipartFile.',
    when:
      'Query strings, HTML form POST application/x-www-form-urlencoded. required=false or defaultValue for optional. Map @RequestParam Map<String,String> all params.',
    flow: `1. GET /orders?page=1&size=10&status=OPEN
2. RequestParamMethodArgumentResolver extracts parameters
3. Type conversion: "1" → int page
4. status=OPEN → enum OrderStatus
5. Missing optional param → null or defaultValue
6. Handler invoked with bound args`,
    lifecycle:
      'Per request. defaultValue used when param absent — not when empty string (usually).',
    proxy:
      'N/A — argument resolver.',
    runtime:
      'Repeated keys ?tag=a&tag=b → List or array. UTF-8 query decoding. Spring MVC 6 Unicode path/query support.',
    failure:
      'MissingServletRequestParameterException — required param absent. Type conversion failure 400. Confusion between @PathVariable and @RequestParam.',
    debug:
      'Log query string in access logs. DEBUG bind errors show param name.',
    production:
      'Sensible defaults for pagination. Validate bounds (max size). Document OpenAPI parameters. Sanitize before SQL.',
    mistakes: [
      'Using @RequestParam for resource id — should be @PathVariable',
      'required=true on optional filter',
      'defaultValue on required param — still required if empty string sent',
      'Huge page size without cap',
    ],
    traps: [
      'Interview: query vs path — @RequestParam vs @PathVariable',
      'defaultValue makes required=false implicitly',
      '@RequestParam Map<String,String> binds all query params',
      'MultipartFile also uses @RequestParam',
    ],
    answer15s:
      '@RequestParam binds query or form parameters. RequestParamMethodArgumentResolver with type conversion and defaultValue support.',
    answer60s:
      '@RequestParam maps ?name=value to method args. required=false or defaultValue for optional. Supports collections for repeated keys. Resolved before handler by RequestMappingHandlerAdapter argument resolvers.',
    answer3m:
      'Resolver: RequestParamMethodArgumentResolver. Sources: query string, form data. vs @PathVariable for REST ids. vs @RequestBody for JSON body. Pagination pattern: page, size, sort. Validation: @Min @Max on params with @Validated on controller class for method-level validation. Pitfalls: missing required, enum typo 400.',
    memory: '@REQUEST_PARAM = query/form; defaultValue = optional.',
  },
  {
    id: 'request-body',
    annotation: '@RequestBody',
    family: 'web',
    what:
      '@Target(PARAMETER) deserializes HTTP request body into object via HttpMessageConverter (typically MappingJackson2HttpMessageConverter for application/json). Uses jakarta.validation when combined with @Valid/@Validated. Required by default — empty body 400.',
    why:
      'JSON/XML request payloads for POST/PUT/PATCH. Type-safe binding to DTO/record instead of manual InputStream parsing.',
    example: `@PostMapping("/payments")
public PaymentResponse charge(@Valid @RequestBody PaymentRequest request) {
  return paymentService.charge(request);
}

public record PaymentRequest(
    @NotBlank String accountId,
    @Positive BigDecimal amount,
    @NotNull Currency currency
) {}`,
    processor:
      'RequestResponseBodyMethodProcessor implements HandlerMethodArgumentResolver + ReturnValueHandler. readWithMessageConverters: selects converter by Content-Type (application/json) and parameter type. Jackson ObjectMapper (Boot auto-config) deserializes bytes → PaymentRequest. @Valid triggers MethodValidationInterceptor or WebDataBinder JSR-303.',
    when:
      'POST/PUT/PATCH with JSON body. Use record/DTO not entity. @Valid for bean validation. Optional @RequestBody(required=false) rare.',
    flow: `1. POST Content-Type: application/json body {...}
2. RequestResponseBodyMethodProcessor.supportsParameter(@RequestBody)
3. HttpMessageConverter canRead(PaymentRequest.class, APPLICATION_JSON)
4. MappingJackson2HttpMessageConverter.read → Jackson parse
5. @Valid triggers validation on PaymentRequest constraints
6. ConstraintViolationException → 400 if @ControllerAdvice handles
7. Handler receives populated PaymentRequest`,
    lifecycle:
      'New DTO instance per request. ObjectMapper modules (JavaTime) from Boot auto-config.',
    proxy:
      'N/A — message conversion layer.',
    runtime:
      'Large body limits: spring.servlet.multipart / server.tomcat.max-http-form-post-size / codec max-in-memory-size (WebFlux). Unknown properties: FAIL_ON_UNKNOWN_PROPERTIES Jackson feature.',
    failure:
      'HttpMessageNotReadableException — malformed JSON, wrong Content-Type. MethodArgumentNotValidException — @Valid field errors. 415 Unsupported Media Type — no converter.',
    debug:
      'Enable logging.level.org.springframework.web.servlet.mvc.method.annotation.RequestResponseBodyMethodProcessor=DEBUG. Log raw body in filter (careful PII).',
    production:
      'DTOs with validation annotations. Custom @ControllerAdvice for 400 errors with field details. Limit payload size. Idempotency-Key header separate from body.',
    mistakes: [
      '@RequestBody on GET — semantic misuse',
      'Binding entity with JPA relationships — over-posting mass assignment',
      'Missing @Valid — constraints ignored',
      'Wrong Content-Type client header',
    ],
    traps: [
      'Interview: RequestResponseBodyMethodProcessor + HttpMessageConverter read path',
      '@Valid on @RequestBody triggers validation before method body',
      'records work as @RequestBody in Boot 3',
      'consumes on mapping must include client Content-Type',
    ],
    answer15s:
      '@RequestBody deserializes request body via HttpMessageConverter (Jackson for JSON). Pair with @Valid for jakarta.validation.',
    answer60s:
      'RequestResponseBodyMethodProcessor selects HttpMessageConverter by Content-Type and parameter type. Jackson maps JSON to DTO. @Valid runs JSR-303 constraints before handler. Failures: HttpMessageNotReadableException, MethodArgumentNotValidException.',
    answer3m:
      'Converter negotiation: read(contentType, paramType). Boot Jackson: JavaTimeModule, property naming. Security: DTO whitelist fields, not entity. @Validated on controller for method param validation (groups). Error handling: @ControllerAdvice MethodArgumentNotValidException → ProblemDetail (Boot 3 RFC 7807). Large payloads: streaming rare in MVC. Pitfalls: unknown JSON fields policy, date formats.',
    memory: '@REQUEST_BODY = HttpMessageConverter + Jackson; add @Valid.',
  },
  {
    id: 'response-body',
    annotation: '@ResponseBody',
    family: 'web',
    what:
      '@Target(METHOD|TYPE) serializes method return value to HTTP response body via HttpMessageConverter instead of view resolution. @RestController meta-includes @ResponseBody on class. Return types: POJO, List, Map, ResponseEntity<T>, String (plain text if StringHttpMessageConverter).',
    why:
      'REST JSON APIs without Thymeleaf view names. Direct serialization to client. ResponseEntity adds status headers.',
    example: `@RestController // includes @ResponseBody
public class HealthController {
  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/payments/{id}")
  public ResponseEntity<PaymentDto> get(@PathVariable Long id) {
    return orderService.findPayment(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }
}`,
    processor:
      'RequestResponseBodyMethodProcessor handleReturnValue: writeWithMessageConverters using Accept header and produces mapping. MappingJackson2HttpMessageConverter writes JSON. ResponseEntityReturnValueHandler sets status/headers then delegates body.',
    when:
      'All REST JSON endpoints. @RestController preferred over @Controller+@ResponseBody per method. ResponseEntity for 404/201 status control.',
    flow: `1. Handler returns PaymentDto or ResponseEntity
2. HandlerMethodReturnValueHandler chain selects processor
3. RequestResponseBodyMethodProcessor writes body
4. Negotiate: Accept: application/json, produces attribute
5. Jackson serialize PaymentDto → response stream
6. Content-Type: application/json set`,
    lifecycle:
      'Serialization per request. Custom ObjectMapper @Bean affects output globally.',
    proxy:
      'N/A.',
    runtime:
      'Circular reference JSON errors — @JsonIgnore or DTO. Null body with 200 — optional empty. gzip compression at server.',
    failure:
      '406 Not Acceptable — no converter for Accept type. HttpMessageNotWritableException — serialization failure. Returning entity with lazy Hibernate collection — LazyInitializationException.',
    debug:
      'TRACE message converter write. Compare response JSON to DTO fields.',
    production:
      'Return DTOs not entities. ResponseEntity for correct HTTP semantics. Version breaking changes via DTO v2. ProblemDetail for errors (Boot 3).',
    mistakes: [
      '@Controller without @ResponseBody returns view name string',
      'Serializing JPA entity with lazy fields',
      'Missing produces causes negotiation surprises',
      'Huge collection without pagination',
    ],
    traps: [
      'Interview: ReturnValueHandler → HttpMessageConverter write',
      '@RestController = @Controller + @ResponseBody',
      'ResponseEntity wraps body + status + headers',
      'String return uses text/plain unless produces json',
    ],
    answer15s:
      '@ResponseBody serializes return value via HttpMessageConverter to response body. @RestController applies it at class level.',
    answer60s:
      'RequestResponseBodyMethodProcessor handles return value writing. Selects converter by Accept and produces. Jackson serializes objects to JSON. ResponseEntity sets status code and headers. Use DTOs to avoid lazy-loading serialization errors.',
    answer3m:
      'Return value handling chain after invoke. Converters: MappingJackson2HttpMessageConverter, StringHttpMessageConverter, ByteArrayHttpMessageConverter. Produces/consumes content negotiation. ResponseEntity pattern for 201 Created with Location header. @ControllerAdvice @ResponseBody on advice methods. Pitfalls: entity graphs, 406 negotiation, null handling.',
    memory: '@RESPONSE_BODY = ReturnValueHandler → Jackson write; @RestController shortcut.',
  },
  {
    id: 'exception-handler',
    annotation: '@ExceptionHandler',
    family: 'web',
    what:
      '@Target(METHOD) on @Controller or @ControllerAdvice handles exceptions thrown by controller methods. Maps exception type to handler method return (JSON error body, ResponseEntity, ProblemDetail). Can be on same controller (local) or @ControllerAdvice (global).',
    why:
      'Centralized error responses — consistent JSON structure, correct HTTP status, hide stack traces from clients, log server-side.',
    example: `@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setTitle("Validation failed");
    problem.setProperty("errors", ex.getBindingResult().getFieldErrors());
    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(PaymentDeclinedException.class)
  @ResponseStatus(HttpStatus.PAYMENT_REQUIRED)
  public ProblemDetail handleDeclined(PaymentDeclinedException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.PAYMENT_REQUIRED, ex.getMessage());
  }
}`,
    processor:
      'ExceptionHandlerExceptionResolver in DispatcherServlet handlerExceptionResolver chain. Discovers @ExceptionHandler methods on @ControllerAdvice beans and originating @Controller. Matches exception type to closest assignable handler. Invokes advice method, writes @ResponseBody return via message converters.',
    when:
      'All REST APIs need global handler. Specific exceptions before generic Exception.class handler. ProblemDetail (RFC 7807) in Boot 3.',
    flow: `1. Controller throws PaymentDeclinedException
2. DispatcherServlet.processDispatchResult catches exception
3. HandlerExceptionResolver chain → ExceptionHandlerExceptionResolver
4. Find @ExceptionHandler(PaymentDeclinedException) on @ControllerAdvice
5. Invoke handleDeclined(ex) → ProblemDetail
6. Write JSON response 402 to client
7. Controller method exception not propagated to servlet`,
    lifecycle:
      'Advice beans singleton. Handler resolution cached. Order @Order on @ControllerAdvice for precedence.',
    proxy:
      '@ControllerAdvice is Spring bean — can inject services. @ExceptionHandler method invoked directly on advice bean.',
    runtime:
      'Unhandled exception → default /error BasicErrorController 500 HTML/JSON. Security exceptions may hit @ControllerAdvice if permitted. Reactive WebFlux: @ControllerAdvice works on annotated controllers.',
    failure:
      'Handler throws second exception — fallback to default resolver. Wrong order — generic Exception catches before specific. Missing @ResponseBody on advice returning object.',
    debug:
      'Log in @ExceptionHandler with exception class and request id. DEBUG ExceptionHandlerExceptionResolver.',
    production:
      'Never expose stack traces. Map domain exceptions to 4xx. Log 5xx with correlation id. @Order(Ordered.HIGHEST_PRECEDENCE) for security handlers.',
    mistakes: [
      '@ExceptionHandler(Exception.class) swallows specifics if ordered wrong',
      'Returning entity with 200 on error',
      'Duplicate handlers same exception type across advice beans',
      'Logging sensitive data from exception message',
    ],
    traps: [
      'Interview: ExceptionHandlerExceptionResolver in DispatcherServlet chain',
      '@RestControllerAdvice = @ControllerAdvice + @ResponseBody',
      'Handler on controller only applies to that controller',
      'ProblemDetail Boot 3 standard error body',
    ],
    answer15s:
      '@ExceptionHandler maps exceptions to handler methods returning error responses. @ControllerAdvice makes handlers global. ExceptionHandlerExceptionResolver invokes them.',
    answer60s:
      'When controller throws, DispatcherServlet delegates to ExceptionHandlerExceptionResolver which finds matching @ExceptionHandler on @ControllerAdvice or controller. Returns ResponseEntity/ProblemDetail serialized to JSON. Order @ControllerAdvice with @Order. Specific exception handlers before broad Exception handler.',
    answer3m:
      'Resolver chain position after handler failure. Matching: most specific exception type wins among applicable advice beans. @RestControllerAdvice for JSON APIs. Boot 3 ProblemDetail integration. vs @ResponseStatus on exception class (declarative, less flexible). Security: AccessDeniedException handling. Pitfalls: advice not scanned (wrong package), swallowed root cause, logging PII.',
    memory: '@EXCEPTION_HANDLER = resolver chain; @RestControllerAdvice global JSON errors.',
  },
  {
    id: 'controller-advice',
    annotation: '@ControllerAdvice · @RestControllerAdvice',
    family: 'web',
    what:
      '@Target(TYPE) global @Controller enhancement applying @ExceptionHandler, @InitBinder, @ModelAttribute methods across controllers. Scoping: basePackages, assignableTypes, annotations (e.g. only @RestController). @RestControllerAdvice = @ControllerAdvice + @ResponseBody on advice methods.',
    why:
      'DRY cross-cutting MVC concerns — validation errors, init binders for date formats, shared model attributes, global exception mapping.',
    example: `@RestControllerAdvice(basePackages = "com.example.api")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalApiAdvice {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ProblemDetail> notFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage()));
  }

  @InitBinder
  public void bindDates(WebDataBinder binder) {
    binder.registerCustomEditor(Instant.class, new InstantPropertyEditor());
  }
}`,
    processor:
      'ControllerAdviceBean wraps each @ControllerAdvice at startup. ExceptionHandlerExceptionResolver, InitBinderDataBinderFactory, and RequestMappingHandlerAdapter consult applicable advice beans filtered by scope. Component-scanned like @Component.',
    when:
      'Global exception handling for REST API package. Multiple advice beans with @Order. Narrow basePackages to avoid affecting actuator endpoints.',
    flow: `1. Context scan discovers @RestControllerAdvice
2. ControllerAdviceBean registers with exception resolver
3. Request hits controller, throws ResourceNotFoundException
4. Resolver filters advice beans matching package com.example.api
5. Invokes notFound handler
6. JSON ProblemDetail returned`,
    lifecycle:
      'Advice beans singleton, initialized at startup. @ModelAttribute advice runs before each controller method in scope.',
    proxy:
      'Advice bean is regular singleton — inject dependencies normally.',
    runtime:
      'Multiple @ControllerAdvice — @Order determines precedence. Actuator endpoints may need separate advice or exclusions.',
    failure:
      'Advice not applied — controller outside basePackages. Conflicting handlers — ambiguous resolution. @ModelAttribute advice unexpected model keys.',
    debug:
      'List ControllerAdviceBean at startup DEBUG. Test exception from each controller package.',
    production:
      'Package-scoped advice. Document error schema. Separate advice for admin vs public API if needed. Do not catch Throwable blindly.',
    mistakes: [
      'Over-broad advice catching actuator errors',
      'Missing @Order — wrong handler wins',
      'basePackages typo — advice never fires',
      '@ControllerAdvice in library not scanned',
    ],
    traps: [
      'Interview: @RestControllerAdvice scopes via basePackages/annotations',
      '@InitBinder for custom editors',
      '@ModelAttribute methods add model to every request',
      'Combine with @ExceptionHandler for global errors',
    ],
    answer15s:
      '@ControllerAdvice applies @ExceptionHandler/@InitBinder/@ModelAttribute globally to controllers. @RestControllerAdvice adds @ResponseBody. Scope with basePackages.',
    answer60s:
      '@ControllerAdvice beans registered as ControllerAdviceBean. ExceptionHandlerExceptionResolver matches exceptions to advice methods. Filter by basePackages, assignableTypes, or annotations. @Order for precedence. @RestControllerAdvice for JSON error bodies across REST controllers.',
    answer3m:
      'Three advice method types: @ExceptionHandler (errors), @InitBinder (binding), @ModelAttribute (shared model). Scoping prevents advice on wrong controllers. Boot default ErrorMvcAutoConfiguration vs custom advice. ProblemDetail standardization. Multiple advice beans: specific package advice + global fallback. Pitfalls: component scan path, actuator pollution, handler ambiguity.',
    memory: '@CONTROLLER_ADVICE = global MVC cross-cut; scope with basePackages.',
  },
  {
    id: 'valid-validated',
    annotation: '@Valid · @Validated',
    family: 'web',
    what:
      '@Valid (jakarta.validation.Valid, JSR-303) on @RequestBody/@ModelAttribute triggers object graph validation after binding. @Validated (org.springframework.validation.annotation.Validated) on class enables method-level validation (Spring) with groups. @Valid cascades nested @Valid fields; @Validated on controller activates MethodValidationInterceptor for @NotNull on @RequestParam/@PathVariable.',
    why:
      'Reject bad input at edge before service layer. @Valid for request DTO structure. @Validated for constraint annotations directly on handler parameters and group sequences.',
    example: `@RestController
@Validated // enables method-level param validation
public class TransferController {

  @PostMapping("/transfers")
  public TransferResult transfer(@Valid @RequestBody TransferRequest body) {
    return transferService.execute(body);
  }

  @GetMapping("/accounts/{id}")
  public AccountDto get(@PathVariable @Positive Long id) {
    return accountService.find(id);
  }
}

public record TransferRequest(
    @NotBlank String fromAccount,
    @NotBlank String toAccount,
    @Positive BigDecimal amount
) {}`,
    processor:
      '@Valid on @RequestBody: RequestResponseBodyMethodProcessor invokes WebDataBinder.validate or jakarta validator directly → MethodArgumentNotValidException. @Validated on class: MethodValidationPostProcessor registers MethodValidationInterceptor around @Validated beans — AOP validates method parameters with constraint annotations before invoke.',
    when:
      '@Valid on complex @RequestBody/@ModelAttribute. @Validated on controller/service class for @RequestParam/@PathVariable constraints and validation groups. Not interchangeable — different mechanisms.',
    flow: `@Valid @RequestBody path:
1. Jackson binds JSON → TransferRequest
2. Validator.validate(request) — jakarta.validation
3. Violations → MethodArgumentNotValidException → @ExceptionHandler

@Validated method param path:
1. TransferController is @Validated bean (AOP proxy)
2. get(@Positive Long id) — MethodValidationInterceptor before invoke
3. ConstraintViolationException if id <= 0`,
    lifecycle:
      'Validation per request at controller boundary. Groups via @Validated(Create.class) on class and groups on constraints.',
    proxy:
      '@Validated on class creates AOP proxy (subclass or JDK) for method validation interception — separate from MVC dispatch proxy.',
    runtime:
      'Custom validators @Constraint impl injected as beans. Hibernate Validator default in Boot. Groups for create vs update DTOs.',
    failure:
      '@Valid forgotten — constraints silently ignored. @Positive on param without @Validated on class — no effect. Confusing MethodArgumentNotValidException vs ConstraintViolationException handlers.',
    debug:
      'Log binding result field errors. Validate unit tests with Validator factory directly.',
    production:
      'Both exception types handled in @ControllerAdvice. Use groups for partial update. Custom messages in validation annotations. Do not duplicate validation in service unless domain rules differ.',
    mistakes: [
      'Constraints on DTO without @Valid on @RequestBody',
      '@NotNull on @PathVariable without @Validated on controller',
      'Mixing javax.validation and jakarta.validation after Boot 3 migration',
      'Only handling MethodArgumentNotValidException not ConstraintViolationException',
    ],
    traps: [
      'Interview: @Valid = object binding validation; @Validated = Spring method-level AOP',
      'MethodArgumentNotValidException vs ConstraintViolationException',
      'Validation groups need @Validated(Group.class) on class/method',
      '@Valid cascades nested objects; @Validated enables param constraints',
    ],
    answer15s:
      '@Valid validates @RequestBody object after binding. @Validated on class enables constraint annotations on method parameters via Spring AOP method validation.',
    answer60s:
      '@Valid triggers jakarta.validation on request DTO — MethodArgumentNotValidException. @Validated activates MethodValidationInterceptor for @RequestParam/@PathVariable constraints. Different exceptions need separate @ExceptionHandler methods. Use validation groups with @Validated(Create.class).',
    answer3m:
      '@Valid mechanism: Hibernate Validator after HttpMessageConverter read. @Validated: MethodValidationPostProcessor + AOP around public methods on annotated class. Groups for create/update flows. Custom @Constraint validators as Spring beans. Boot 3 jakarta.validation namespace. ControllerAdvice handlers for both exception types returning ProblemDetail with field errors. Service layer: optional @Validated for defensive internal APIs. Pitfalls: missing @Validated on class, wrong exception handler.',
    memory: '@VALID = DTO body; @VALIDATED = method param AOP validation.',
    tables: [
      {
        headers: ['', '@Valid', '@Validated'],
        rows: [
          ['Typical target', '@RequestBody DTO', 'Controller class + method params'],
          ['Mechanism', 'JSR-303 after bind', 'Spring MethodValidationInterceptor'],
          ['Exception', 'MethodArgumentNotValidException', 'ConstraintViolationException'],
          ['Groups', 'On constraint annotation', '@Validated(Group.class) on class'],
        ],
      },
    ],
  },
  {
    id: 'mvc-dispatch-flow',
    annotation: 'DispatcherServlet request flow',
    family: 'web',
    what:
      'End-to-end Spring MVC (Servlet stack) request processing: Front Controller DispatcherServlet orchestrates HandlerMapping, HandlerAdapter, argument resolvers, return value handlers, and HttpMessageConverter — Boot 3 / SF 6 / jakarta.servlet.',
    why:
      'Interview staple: explain how HTTP becomes Java method call and back to JSON. Debug 404/400/415 by knowing which stage failed.',
    example: `// No annotation — architectural flow
// Client: GET /api/orders/1 Accept: application/json
// → DispatcherServlet.doDispatch()
// → OrderController.get(1L) → OrderDto
// → JSON response`,
    processor:
      'DispatcherServlet (FrameworkServlet): doDispatch → getHandler → getHandlerAdapter → ha.handle → processDispatchResult. Key beans: RequestMappingHandlerMapping, RequestMappingHandlerAdapter, RequestResponseBodyMethodProcessor, ExceptionHandlerExceptionResolver, MappingJackson2HttpMessageConverter.',
    when:
      'Explain MVC pipeline in interviews. Troubleshoot mapping vs binding vs conversion vs serialization failures.',
    flow: `Detailed pipeline:
1. **DispatcherServlet** receives request (Boot auto-registers on /*)
2. **HandlerMapping** — RequestMappingHandlerMapping matches path+method → HandlerExecutionChain(HandlerMethod, interceptors)
3. **HandlerInterceptor** preHandle (optional auth, logging)
4. **HandlerAdapter** — RequestMappingHandlerAdapter supports HandlerMethod
5. **ArgumentResolver** chain binds args:
   - PathVariableMethodArgumentResolver
   - RequestParamMethodArgumentResolver
   - RequestResponseBodyMethodProcessor (@RequestBody read)
6. **Invoke** controller method via reflection
7. **ReturnValueHandler** — RequestResponseBodyMethodProcessor (@ResponseBody)
8. **HttpMessageConverter** — MappingJackson2HttpMessageConverter.write(OrderDto)
9. **HandlerInterceptor** afterCompletion
10. On exception → **HandlerExceptionResolver** → @ExceptionHandler`,
    lifecycle:
      'Servlet container threads (tomcat http-nio). One thread per request unless async MVC DeferredResult/Callable.',
    proxy:
      'Controller may be CGLIB proxy if @Transactional/@Validated/@Cacheable on controller (unusual). Argument resolution unaffected.',
    runtime:
      'Filter chain runs before DispatcherServlet: Spring Security FilterChainProxy, CharacterEncodingFilter, etc. Security establishes context before controller.',
    failure:
      '404 — step 2 no handler. 400 — step 5 binding/validation. 415 — step 5 no converter. 406 — step 8 write negotiation. 500 — unhandled exception step 10 miss.',
    debug:
      'DEBUG org.springframework.web.servlet.DispatcherServlet. TRACE handler mapping and argument resolvers. Spring Boot actuator mappings endpoint.',
    production:
      'Filters for auth, correlation ids. ControllerAdvice for errors. Timeouts at gateway. Avoid heavy work in interceptors.',
    mistakes: [
      'Confusing Filter chain with DispatcherServlet',
      'Assuming @Component in wrong package is mapped',
      'Debugging serialization when mapping 404',
    ],
    traps: [
      'Interview must say: HandlerMapping → ArgumentResolver → ReturnValueHandler → HttpMessageConverter',
      'Filters vs DispatcherServlet order',
      'HandlerMethod vs handler bean confusion',
      'Content negotiation Accept vs produces',
    ],
    answer15s:
      'DispatcherServlet → HandlerMapping finds HandlerMethod → HandlerAdapter resolves args → invokes controller → ReturnValueHandler → HttpMessageConverter writes response.',
    answer60s:
      'RequestMappingHandlerMapping matches URL to HandlerMethod. RequestMappingHandlerAdapter runs HandlerMethodArgumentResolver chain for @PathVariable, @RequestParam, @RequestBody. Method invoked. RequestResponseBodyMethodProcessor serializes return via HttpMessageConverter (Jackson). Exceptions go to ExceptionHandlerExceptionResolver and @ControllerAdvice.',
    answer3m:
      'Walk full doDispatch with filter chain before servlet. HandlerMapping order: RequestMappingHandlerMapping primary for annotations. Adapter invocation internals: ServletInvocableHandlerMethod. Message converters selected by content type and accept headers. Interceptors for cross-cutting. Contrast reactive WebFlux: DispatcherHandler, HandlerFunction, no servlet. Sync MVC thread model vs WebFlux event loop. Debug each HTTP status to stage. Production: ProblemDetail errors, validation at boundary, security filters first.',
    memory: 'MVC FLOW: Map → Resolve args → Invoke → Convert response.',
    tables: [
      {
        headers: ['Stage', 'Component', 'Failure HTTP'],
        rows: [
          ['Map URL', 'RequestMappingHandlerMapping', '404'],
          ['Bind args', 'HandlerMethodArgumentResolver', '400'],
          ['Read body', 'HttpMessageConverter read', '400/415'],
          ['Handle', 'Controller method', '500/domain'],
          ['Write body', 'HttpMessageConverter write', '406/500'],
          ['Exception', 'ExceptionHandlerExceptionResolver', '4xx/5xx JSON'],
        ],
      },
    ],
  },
  {
    id: 'webflux-contrast',
    annotation: 'WebFlux contrast (optional)',
    family: 'web',
    what:
      'Spring WebFlux — reactive stack on Netty (default), @RestController works similarly but returns Mono<T>/Flux<T>. DispatcherHandler replaces DispatcherServlet. RouterFunction alternative to annotations. Boot 3 jakarta, Project Reactor.',
    why:
      'Interview contrast: when servlet MVC vs reactive. Same annotations often work but threading and blocking rules differ. Know you are on servlet stack if using spring-boot-starter-web (Tomcat).',
    example: `@RestController
@RequestMapping("/api/products")
public class ProductWebFluxController {
  private final ProductRepository repo; // R2DBC reactive repo

  @GetMapping("/{id}")
  public Mono<ProductDto> get(@PathVariable Long id) {
    return repo.findById(id).map(ProductDto::from);
  }
}

// Functional style (no annotations):
@Bean
public RouterFunction<ServerResponse> routes(ProductHandler handler) {
  return route(GET("/api/products/{id}"), handler::get);
}`,
    processor:
      'DispatcherHandler → RequestMappingHandlerMapping (reactive) → InvocableHandlerMethod for @Controller. ReactiveReturnValueHandler for Mono/Flux. HttpMessageReader/Writer instead of HttpMessageConverter (Encoder/Decoder abstraction). Netty event loop — blocking JDBC in handler thread starves loop.',
    when:
      'High concurrency I/O with reactive drivers (R2DBC, WebClient). NOT for blocking JPA-heavy apps without bounded elastic scheduler. Optional interview mention when discussing MVC flow.',
    flow: `WebFlux request:
1. Netty receives bytes
2. DispatcherHandler.route
3. HandlerMapping → HandlerMethod
4. Argument resolvers (reactive adapters)
5. Return Mono<Dto> subscribed
6. Encoder writes JSON when signal emits
7. Backpressure via Reactor`,
    lifecycle:
      'Event loop threads — never block. subscribeOn boundedElastic for blocking call isolation (escape hatch).',
    proxy:
      'Same AOP caveats on @Transactional blocking — incompatible with event loop blocking.',
    runtime:
      'spring-boot-starter-webflux vs starter-web mutual preference in Boot — one primary web stack. WebFlux can run on servlet (deprecated Undertow hybrid).',
    failure:
      'Blocking call on event loop — latency spike. Mixing MVC + WebFlux in same app — confusing. Missing reactive driver — falls back to blocking defeats purpose.',
    debug:
      'reactor.netty logging. BlockHound in tests detects blocking on reactive threads.',
    production:
      'Choose one stack. WebFlux + R2DBC + WebClient for fully reactive pipeline. Most enterprise apps stay servlet MVC + JPA.',
    mistakes: [
      'WebFlux with blocking JPA in controller',
      'Assuming identical exception handling — reactive types differ',
      'Using WebFlux for CPU-bound without benefit',
    ],
    traps: [
      'Interview: DispatcherHandler not DispatcherServlet',
      'Mono/Flux return types signal async pipeline',
      'Same @GetMapping syntax, different runtime threading',
      'Most Spring apps are servlet MVC — WebFlux is niche',
    ],
    answer15s:
      'WebFlux uses DispatcherHandler and reactive Mono/Flux returns on Netty. Same annotations possible but blocking JDBC/JPA on event loop is an anti-pattern.',
    answer60s:
      'WebFlux replaces servlet stack with reactive ServerWebExchange. @RestController methods return Mono/Flux. HttpMessageReader/Writer encode/decode. Use with reactive data access. Servlet MVC uses DispatcherServlet and blocking threads — simpler with JPA.',
    answer3m:
      'Architecture: event loop vs thread-per-request. Annotation parity mostly but return types differ. RouterFunction functional routing without annotations. When to choose: many concurrent I/O connections, reactive end-to-end. When not: JPA-heavy CRUD. Hybrid pitfalls. Security: WebFilter vs Filter. Testing: WebTestClient vs MockMvc.',
    memory: 'WEBFLUX: DispatcherHandler + Mono/Flux; no blocking on event loop.',
  },
];
