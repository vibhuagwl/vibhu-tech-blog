#!/usr/bin/env python3
"""Generate lib/gof-design-patterns/*.ts catalog sources for the GoF hub."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lib" / "gof-design-patterns"

DEMO = {
    "singleton": "src/main/java/com/example/designpatterns/creational/singleton/ConfigManagerDemo.java",
    "factory-method": "src/main/java/com/example/designpatterns/creational/factory/PaymentGatewayFactoryDemo.java",
    "abstract-factory": "src/main/java/com/example/designpatterns/creational/abstractfactory/RegionalBankingFactoryDemo.java",
    "builder": "src/main/java/com/example/designpatterns/creational/builder/PaymentTransactionBuilderDemo.java",
    "prototype": "src/main/java/com/example/designpatterns/creational/prototype/ReportConfigurationPrototypeDemo.java",
    "adapter": "src/main/java/com/example/designpatterns/structural/adapter/LegacyPaymentAdapterDemo.java",
    "bridge": "src/main/java/com/example/designpatterns/structural/bridge/NotificationBridgeDemo.java",
    "composite": "src/main/java/com/example/designpatterns/structural/composite/OrderCompositeDemo.java",
    "decorator": "src/main/java/com/example/designpatterns/structural/decorator/PaymentDecoratorDemo.java",
    "facade": "src/main/java/com/example/designpatterns/structural/facade/PaymentFacadeDemo.java",
    "flyweight": "src/main/java/com/example/designpatterns/structural/flyweight/CurrencyFlyweightDemo.java",
    "proxy": "src/main/java/com/example/designpatterns/structural/proxy/PaymentServiceProxyDemo.java",
    "chain-of-responsibility": "src/main/java/com/example/designpatterns/behavioral/chainofresponsibility/PaymentValidationChainDemo.java",
    "command": "src/main/java/com/example/designpatterns/behavioral/command/PaymentCommandDemo.java",
    "interpreter": "src/main/java/com/example/designpatterns/behavioral/interpreter/TransactionRuleInterpreterDemo.java",
    "iterator": "src/main/java/com/example/designpatterns/behavioral/iterator/TransactionIteratorDemo.java",
    "mediator": "src/main/java/com/example/designpatterns/behavioral/mediator/OrderProcessingMediatorDemo.java",
    "memento": "src/main/java/com/example/designpatterns/behavioral/memento/PaymentConfigurationMementoDemo.java",
    "observer": "src/main/java/com/example/designpatterns/behavioral/observer/PaymentObserverDemo.java",
    "state": "src/main/java/com/example/designpatterns/behavioral/state/PaymentStateDemo.java",
    "strategy": "src/main/java/com/example/designpatterns/behavioral/strategy/PaymentStrategyDemo.java",
    "template-method": "src/main/java/com/example/designpatterns/behavioral/templatemethod/PaymentProcessingTemplateDemo.java",
    "visitor": "src/main/java/com/example/designpatterns/behavioral/visitor/AccountVisitorDemo.java",
}

FREQ = {
    "singleton": "Occasionally used",
    "factory-method": "Frequently used",
    "abstract-factory": "Occasionally used",
    "builder": "Frequently used",
    "prototype": "Specialized",
    "adapter": "Frequently used",
    "bridge": "Specialized",
    "composite": "Occasionally used",
    "decorator": "Frequently used",
    "facade": "Frequently used",
    "flyweight": "Specialized",
    "proxy": "Frequently used",
    "chain-of-responsibility": "Frequently used",
    "command": "Frequently used",
    "interpreter": "Rare but interview-important",
    "iterator": "Occasionally used",
    "mediator": "Occasionally used",
    "memento": "Specialized",
    "observer": "Frequently used",
    "state": "Frequently used",
    "strategy": "Frequently used",
    "template-method": "Occasionally used",
    "visitor": "Rare but interview-important",
}


def arr(items: list[str]) -> str:
    return "[\n" + ",\n".join(f"    {json.dumps(i)}" for i in items) + ",\n  ]"


def comps(items: list[tuple[str, str]]) -> str:
    lines = [
        f"    {{name: {json.dumps(n)}, responsibility: {json.dumps(r)}}}" for n, r in items
    ]
    return "[\n" + ",\n".join(lines) + ",\n  ]"


def card_ts(p: dict) -> str:
    deep = json.dumps("/java-design-patterns-real-world?file=" + p["demo"])
    spring = p.get("springCode") or ""
    return f"""  gofCard({{
    id: {json.dumps(p["id"])},
    part: {p["part"]},
    name: {json.dumps(p["name"])},
    frequency: {json.dumps(p["frequency"])},
    definition: {json.dumps(p["definition"])},
    problem: {json.dumps(p["problem"])},
    realWorld: {json.dumps(p["realWorld"])},
    whyExists: {json.dumps(p["whyExists"])},
    ascii: {json.dumps(p["ascii"])},
    flow: {json.dumps(p["flow"])},
    components: {comps(p["components"])},
    javaCode: {json.dumps(p["javaCode"])},
    springCode: {json.dumps(spring)},
    unitTest: {json.dumps(p["unitTest"])},
    edgeCases: {arr(p["edgeCases"])},
    failureScenarios: {arr(p["failureScenarios"])},
    retry: {json.dumps(p["retry"])},
    idempotency: {json.dumps(p["idempotency"])},
    timeout: {json.dumps(p["timeout"])},
    observability: {json.dumps(p["observability"])},
    security: {json.dumps(p["security"])},
    performance: {json.dumps(p["performance"])},
    scalability: {json.dumps(p["scalability"])},
    production: {json.dumps(p["production"])},
    mistakes: {arr(p["mistakes"])},
    antiPatterns: {arr(p["antiPatterns"])},
    alternatives: {arr(p["alternatives"])},
    tradeoffs: {json.dumps(p["tradeoffs"])},
    interviewQs: {arr(p["interviewQs"])},
    trickyQs: {arr(p["trickyQs"])},
    seniorFollowUps: {arr(p["seniorFollowUps"])},
    deepLabHref: {deep},
  }})"""


def add(patterns: list, **kw):
    kw["frequency"] = FREQ[kw["id"]]
    kw["demo"] = DEMO[kw["id"]]
    patterns.append(kw)


def all_patterns() -> list[dict]:
    p: list[dict] = []
    # CREATIONAL -----------------------------------------------------------------
    add(
        p,
        id="singleton",
        part=1,
        cat="creational",
        name="Singleton",
        definition="Ensure one shared instance of a process-global resource — holiday calendar, UTR sequence, config cache.",
        problem="Duplicate ConfigManager / HolidayCalendar instances drift under concurrency: fraud thinks Monday is a holiday, ledger does not.",
        realWorld="Meridian Bank lab: ConfigManagerDemo uses Bill Pugh holder + enum singleton; Spring @Bean singleton is the production form.",
        whyExists="Some things are truly singular. Without a controlled single instance, caches and sequences diverge and audits fail.",
        ascii="Caller → ConfigManager.getInstance()\n           │\n      Holder.INSTANCE (one JVM)\n           │\n   payment.timeout / fraud.threshold",
        flow="Boot → Holder initializes once → all callers read same map → never new ConfigManager().",
        components=[
            ("ConfigManager", "Holds shared config map; private ctor"),
            ("Holder", "Initialization-on-demand; JVM class-init safety"),
            ("EnumConfigManager", "Enum singleton alternative for region flags"),
        ],
        javaCode="public final class ConfigManager {\n  private final Map<String, String> config =\n      Map.of(\"payment.timeout\", \"30s\", \"fraud.threshold\", \"5000\");\n  private ConfigManager() {}\n  private static class Holder {\n    private static final ConfigManager INSTANCE = new ConfigManager();\n  }\n  public static ConfigManager getInstance() { return Holder.INSTANCE; }\n  public String get(String key) { return config.get(key); }\n}",
        springCode="@Configuration\nclass BankingSingletons {\n  @Bean\n  HolidayCalendar holidayCalendar() {\n    return HolidayCalendar.loadFrom(\"classpath:rbi-holidays.json\");\n  }\n}",
        unitTest="@Test void sameInstance() {\n  assertSame(ConfigManager.getInstance(), ConfigManager.getInstance());\n}",
        edgeCases=["Classloader duplicates in app servers", "Mutable singleton state races", "Test pollution from static reset"],
        failureScenarios=["Config reload mid-flight without versioning", "Two JVMs each with own singleton — not cluster-wide"],
        retry="N/A — reads are local; retry config remote fetch with backoff at boot.",
        idempotency="get() is side-effect free.",
        timeout="Remote config load at boot ≤ 5s; fail fast if missing required keys.",
        observability="config_reload_total; gauge config_keys; never log secrets.",
        security="Treat config as sensitive; restrict who can mutate.",
        performance="O(1) map lookup; avoid locking on hot path (immutable map).",
        scalability="Per-JVM only — use Redis/DB for cluster-wide sequence.",
        production="Prefer Spring singleton beans over hand-rolled static; use enum/holder when you must.",
        mistakes=["God-object singleton", "Double-checked locking without volatile"],
        antiPatterns=["Mutable global balance cache named Singleton"],
        alternatives=["Spring @Bean singleton", "Enum singleton", "External config service"],
        tradeoffs="Pros: one source of truth per JVM. Cons: hard to fake in tests; not distributed.",
        interviewQs=["Enum vs Bill Pugh vs DCL?", "Is a Spring bean a Singleton?", "How do you test without static reset?"],
        trickyQs=["Two classloaders — two singletons?", "Cluster-wide uniqueness?"],
        seniorFollowUps=["When is a process singleton wrong for multi-tenant SaaS?"],
    )
    add(
        p,
        id="factory-method",
        part=1,
        cat="creational",
        name="Factory Method",
        definition="Let a creator decide which PaymentRail / PaymentGateway implementation to instantiate.",
        problem="Controllers call new UpiGateway() — adding IMPS means editing every call site.",
        realWorld="PaymentGatewayFactoryDemo: method=UPI|CARD|NEFT → concrete gateway; Pay button stays stable.",
        whyExists="Open/closed: new rails without rewriting orchestration.",
        ascii="PayController → PaymentGatewayFactory.create(method)\n                 ├─ UPI → UpiGateway\n                 ├─ CARD → CardGateway\n                 └─ NEFT → NeftGateway",
        flow="Request method → factory maps to interface → caller uses PaymentGateway only.",
        components=[
            ("PaymentGateway", "Product interface (authorize/capture)"),
            ("Concrete gateways", "UPI / Card / NEFT implementations"),
            ("PaymentGatewayFactory", "Chooses concrete product from method code"),
        ],
        javaCode="public interface PaymentGateway { String charge(int amount); }\npublic final class UpiGateway implements PaymentGateway {\n  public String charge(int amount) { return \"upi:\" + amount; }\n}\npublic final class PaymentGatewayFactory {\n  public PaymentGateway create(String method) {\n    return switch (method) {\n      case \"UPI\" -> new UpiGateway();\n      case \"CARD\" -> new CardGateway();\n      case \"NEFT\" -> new NeftGateway();\n      default -> throw new IllegalArgumentException(method);\n    };\n  }\n}",
        springCode="@Component\nclass SpringPaymentGatewayFactory {\n  private final Map<String, PaymentGateway> byMethod;\n  SpringPaymentGatewayFactory(List<PaymentGateway> all) {\n    this.byMethod = all.stream().collect(toMap(PaymentGateway::method, identity()));\n  }\n  PaymentGateway create(String method) {\n    return Optional.ofNullable(byMethod.get(method))\n        .orElseThrow(() -> new IllegalArgumentException(method));\n  }\n}",
        unitTest="@Test void createsUpi() {\n  assertInstanceOf(UpiGateway.class, new PaymentGatewayFactory().create(\"UPI\"));\n}",
        edgeCases=["Unknown method code", "Null method", "Case sensitivity of codes"],
        failureScenarios=["Missing Spring bean for new rail", "Factory returns wrong currency rail"],
        retry="Creation is local; retry downstream charge with idempotency key.",
        idempotency="Factory create is pure; charge needs idempotency key.",
        timeout="Factory O(1); gateway charge timeout separate (e.g. 3s).",
        observability="gateway_factory_selected_total{method}",
        security="Whitelist method codes — never Class.forName(clientInput).",
        performance="Map/registry dispatch O(1).",
        scalability="Stateless factory scales with service replicas.",
        production="Register gateways via Spring Map / List injection.",
        mistakes=["Giant switch that also charges", "Returning concrete types to controllers"],
        antiPatterns=["Reflection Class.forName(clientInput)"],
        alternatives=["Strategy registry", "Abstract Factory when a whole kit must match"],
        tradeoffs="Pros: OCP for new rails. Cons: switch/map must stay complete.",
        interviewQs=["Factory Method vs Simple Factory?", "Factory Method vs Strategy?"],
        trickyQs=["When does Factory Method become Abstract Factory?"],
        seniorFollowUps=["How do you version rails without breaking old clients?"],
    )
    add(
        p,
        id="abstract-factory",
        part=1,
        cat="creational",
        name="Abstract Factory",
        definition="Create a matching family of related products (currency + rail + regulator pack) without mixing kits.",
        problem="India UPI wired to a USD ledger — incompatible family members leak into production.",
        realWorld="RegionalBankingFactoryDemo: IndiaFactory vs UsFactory produce compatible Account/Rail/Report trio.",
        whyExists="Some objects only make sense together; the factory encodes that invariant.",
        ascii="RegionalBankingFactory\n  ├─ IndiaFactory → InrAccount + UpiRail + RbiReport\n  └─ UsFactory    → UsdAccount + AchRail + FedReport",
        flow="Pick region → factory → createAccount/createRail/createReport → use as a set.",
        components=[
            ("RegionalBankingFactory", "Abstract factory interface"),
            ("IndiaFactory / UsFactory", "Concrete families"),
            ("Account / Rail / Report", "Abstract products"),
        ],
        javaCode="public interface RegionalBankingFactory {\n  Account createAccount();\n  PaymentRail createRail();\n  RegulatoryReport createReport();\n}\npublic final class IndiaFactory implements RegionalBankingFactory {\n  public Account createAccount() { return new InrAccount(); }\n  public PaymentRail createRail() { return new UpiRail(); }\n  public RegulatoryReport createReport() { return new RbiMisReport(); }\n}",
        springCode="@Configuration\n@Profile(\"region-in\")\nclass IndiaBankingConfig {\n  @Bean RegionalBankingFactory regionalBankingFactory() { return new IndiaFactory(); }\n}",
        unitTest="@Test void indiaFamilyMatches() {\n  var f = new IndiaFactory();\n  assertEquals(\"INR\", f.createAccount().currency());\n  assertEquals(\"UPI\", f.createRail().code());\n}",
        edgeCases=["Cross-region FX corridors", "Partial family when a product is shared"],
        failureScenarios=["Wrong @Profile active in prod", "Mixing products from two factories"],
        retry="N/A at creation; rail calls retry separately.",
        idempotency="Family creation is pure.",
        timeout="Boot-time factory wiring only.",
        observability="region_factory_active{region}",
        security="Region from trusted config, not raw client header alone.",
        performance="One factory per JVM/region context.",
        scalability="Per-region services often isolate factories.",
        production="Profile or tenant → factory; assert family invariants in IT.",
        mistakes=["Abstract Factory for a single varying product"],
        antiPatterns=["God factory creating unrelated HR + ATM objects"],
        alternatives=["Factory Method", "Spring @Configuration per region"],
        tradeoffs="Pros: family integrity. Cons: more types; overkill for one product.",
        interviewQs=["Abstract Factory vs Factory Method?", "How do you prevent kit mixing?"],
        trickyQs=["Can products share across families?"],
        seniorFollowUps=["Multi-region tenant on one JVM — how do you scope factories?"],
    )
    add(
        p,
        id="builder",
        part=1,
        cat="creational",
        name="Builder",
        definition="Assemble a complex PaymentTransaction with many optional fields without telescoping constructors.",
        problem="20-arg constructors hide which fields are set; optional remarks/GSTIN/split become bug magnets.",
        realWorld="PaymentTransactionBuilderDemo: amount, payee, remarks, GSTIN built step-by-step; validate before build().",
        whyExists="Readable construction + validation at the end of the fluent chain.",
        ascii="new PaymentTransaction.Builder()\n  .amount(45000).payee(vpa).remarks(\"rent\")\n  .gstin(...).build()",
        flow="Fluent setters → validate requireds → immutable PaymentTransaction.",
        components=[
            ("PaymentTransaction", "Immutable product"),
            ("Builder", "Fluent assembly + validation"),
            ("Caller", "Controller / use-case fills the form"),
        ],
        javaCode="public final class PaymentTransaction {\n  private final int amount; private final String payee; private final String remarks;\n  private PaymentTransaction(Builder b) {\n    this.amount = b.amount; this.payee = b.payee; this.remarks = b.remarks;\n  }\n  public static final class Builder {\n    private int amount; private String payee; private String remarks = \"\";\n    public Builder amount(int a) { this.amount = a; return this; }\n    public Builder payee(String p) { this.payee = p; return this; }\n    public Builder remarks(String r) { this.remarks = r; return this; }\n    public PaymentTransaction build() {\n      if (amount <= 0 || payee == null || payee.isBlank())\n        throw new IllegalStateException(\"amount/payee required\");\n      return new PaymentTransaction(this);\n    }\n  }\n}",
        springCode="// Prefer Java records + builder for DTOs; MapStruct for API→domain mapping.",
        unitTest="@Test void rejectsMissingPayee() {\n  assertThrows(IllegalStateException.class,\n    () -> new PaymentTransaction.Builder().amount(100).build());\n}",
        edgeCases=["Reuse builder after build", "Default vs explicit null", "Money scale/currency"],
        failureScenarios=["Partial build published to Kafka", "Validation rules diverge from API schema"],
        retry="Rebuild on validation failure with corrected fields.",
        idempotency="build() should be pure given same inputs.",
        timeout="N/A",
        observability="builder_validation_failures_total{field}",
        security="Sanitize remarks; never put PAN in builder logs.",
        performance="Negligible vs I/O.",
        scalability="Builders are per-request — no shared mutable builder.",
        production="Lombok @Builder OK if validate in build(); prefer explicit for money.",
        mistakes=["Mutable product after build", "No validation in build()"],
        antiPatterns=["Telescoping constructors + builder half-migration"],
        alternatives=["Factory Method", "Canonical constructor for 2–3 fields"],
        tradeoffs="Pros: clarity. Cons: boilerplate; overkill for tiny types.",
        interviewQs=["Builder vs Factory?", "How do you make Builder thread-safe?"],
        trickyQs=["Should build() return Optional or throw?"],
        seniorFollowUps=["Money/BigDecimal builder — scale and rounding policy?"],
    )
    add(
        p,
        id="prototype",
        part=1,
        cat="creational",
        name="Prototype",
        definition="Clone a template object (standing instruction / report config) instead of rebuilding expensive setup.",
        problem="Rebuilding a 12-field standing instruction every month duplicates bugs and misses fields.",
        realWorld="ReportConfigurationPrototypeDemo: clone report/SI template, change date, do not copy last UTR.",
        whyExists="Cheap copy of a known-good template with controlled deep/shallow rules.",
        ascii="StandingInstruction template\n        │ copyForNextMonth()\n        ▼\nNext-month SI (new date, cleared UTR)",
        flow="Load template → clone → mutate allowed fields → persist new instance.",
        components=[
            ("Prototype", "copy / clone method"),
            ("Template store", "Canonical standing instructions"),
            ("Editor", "Applies allowed field overrides"),
        ],
        javaCode="public final class StandingInstruction {\n  private String payeeVpa; private int amount; private String lastUtr;\n  private LocalDate scheduleDate;\n  public StandingInstruction copyForNextMonth(LocalDate next) {\n    StandingInstruction c = new StandingInstruction();\n    c.payeeVpa = this.payeeVpa; c.amount = this.amount;\n    c.lastUtr = null; // never copy identity\n    c.scheduleDate = next;\n    return c;\n  }\n}",
        springCode="// Prefer explicit copy methods over Object.clone(); document deep vs shallow.",
        unitTest="@Test void cloneClearsUtr() {\n  var next = original.copyForNextMonth(LocalDate.parse(\"2026-09-01\"));\n  assertNull(next.lastUtr());\n  assertEquals(original.amount(), next.amount());\n}",
        edgeCases=["Deep copy of nested holds", "Identity fields accidentally shared", "Clone of POSTED state"],
        failureScenarios=["Shallow copy mutates template", "Clone carries last month settlement id"],
        retry="N/A",
        idempotency="copy should be deterministic.",
        timeout="N/A",
        observability="prototype_clone_total{type}",
        security="Do not clone secrets into lower environments without redaction.",
        performance="Cheaper than rebuild when templates are large.",
        scalability="Fine for SI volume; watch deep-copy cost on huge graphs.",
        production="Explicit copyForX methods beat Cloneable.",
        mistakes=["Using Object.clone() without understanding shallow copy"],
        antiPatterns=["Prototype as substitute for a proper factory of new domain objects"],
        alternatives=["Builder from template DTO", "Copy constructor"],
        tradeoffs="Pros: speed/consistency. Cons: copy rules become a second model.",
        interviewQs=["Deep vs shallow copy?", "Prototype vs Builder?"],
        trickyQs=["Cloneable pitfalls in Java?"],
        seniorFollowUps=["Event-sourced rebuild vs prototype clone?"],
    )

    # STRUCTURAL ------------------------------------------------------------------
    add(
        p,
        id="adapter",
        part=2,
        cat="structural",
        name="Adapter",
        definition="Translate a foreign API (legacy CBS / NPCI SDK) into the bank’s PaymentGateway interface.",
        problem="ISO-8583 CBS and modern PaymentInstruction speak different shapes; leaking either pollutes the domain.",
        realWorld="LegacyPaymentAdapterDemo wraps legacy charge API so Meridian code only sees PaymentGateway.",
        whyExists="You do not own the other contract; adapters localize version churn.",
        ascii="Domain PaymentGateway\n         ▲\n   LegacyPaymentAdapter\n         │\n   LegacyCbsClient (ISO-8583)",
        flow="Instruction → adapter maps fields → legacy call → map response/errors back.",
        components=[
            ("PaymentGateway", "Target interface the bank owns"),
            ("LegacyPaymentAdapter", "Maps to/from legacy SDK"),
            ("LegacyCbsClient", "Foreign / unowned API"),
        ],
        javaCode="public interface PaymentGateway { String pay(PaymentInstruction i); }\npublic final class LegacyPaymentAdapter implements PaymentGateway {\n  private final LegacyCbsClient cbs;\n  public String pay(PaymentInstruction i) {\n    LegacyRequest req = new LegacyRequest(i.account(), i.amountPaise());\n    LegacyResponse res = cbs.charge(req);\n    if (!res.ok()) throw new PaymentRejected(res.code());\n    return res.rrn();\n  }\n}",
        springCode="@Bean PaymentGateway legacyGateway(LegacyCbsClient cbs) {\n  return new LegacyPaymentAdapter(cbs);\n}",
        unitTest="@Test void mapsRejection() {\n  when(cbs.charge(any())).thenReturn(LegacyResponse.fail(\"51\"));\n  assertThrows(PaymentRejected.class, () -> adapter.pay(sample));\n}",
        edgeCases=["Partial field mapping", "Charset / amount scale", "Timeout vs decline codes"],
        failureScenarios=["SDK version bump breaks mapping", "Legacy returns success twice (duplicate RRN)"],
        retry="Retry only idempotent legacy ops with same RRN/idempotency key.",
        idempotency="Adapter must forward idempotency key into legacy request.",
        timeout="Bound legacy calls (e.g. 2–3s); map timeout to domain error.",
        observability="adapter_calls_total{target,result}; latency histogram",
        security="Do not log full ISO payloads with PAN; mask in adapter.",
        performance="Thin mapping layer; avoid reflection.",
        scalability="Stateless adapters scale with service.",
        production="One adapter per foreign system; contract tests against SDK stubs.",
        mistakes=["Leaking LegacyRequest into controllers", "God adapter for five vendors"],
        antiPatterns=["Adapter forever when you own both sides"],
        alternatives=["Rewrite contract", "Anti-corruption layer (DDD)", "Facade (many internals, not one foreign)"],
        tradeoffs="Pros: domain stays clean. Cons: mapping debt; dual models.",
        interviewQs=["Adapter vs Facade?", "Adapter vs Anti-Corruption Layer?"],
        trickyQs=["Where do you put amount scale conversion?"],
        seniorFollowUps=["How do you version adapters during dual-run cutover?"],
    )
    add(
        p,
        id="bridge",
        part=2,
        cat="structural",
        name="Bridge",
        definition="Separate two independent axes (notification channel × vendor) so they can vary without class explosion.",
        problem="SmsTwilio, SmsSes, EmailTwilio, EmailSes… N×M subclasses.",
        realWorld="NotificationBridgeDemo: Notification holds a Sender; SMS/Email × Twilio/SES compose freely.",
        whyExists="Two dimensions of change should not be fused into one inheritance tree.",
        ascii="Notification (SMS | Email)\n      │ has-a\n   Sender (Twilio | SES | SNS)",
        flow="Pick channel abstraction → inject sender implementor → send() delegates.",
        components=[
            ("Notification", "Abstraction (SMS/Email)"),
            ("Sender", "Implementor (Twilio/SES)"),
            ("Concrete pairs", "Composed at runtime"),
        ],
        javaCode="public interface Sender { void deliver(String to, String body); }\npublic abstract class Notification {\n  protected final Sender sender;\n  protected Notification(Sender sender) { this.sender = sender; }\n  public abstract void notify(String to, String body);\n}\npublic final class SmsNotification extends Notification {\n  public SmsNotification(Sender s) { super(s); }\n  public void notify(String to, String body) { sender.deliver(to, \"SMS:\" + body); }\n}",
        springCode="@Bean Notification paymentSms(Sender twilioSender) {\n  return new SmsNotification(twilioSender);\n}",
        unitTest="@Test void smsUsesInjectedSender() {\n  Sender spy = mock(Sender.class);\n  new SmsNotification(spy).notify(\"999\", \"posted\");\n  verify(spy).deliver(eq(\"999\"), contains(\"SMS\"));\n}",
        edgeCases=["Null sender", "Channel-specific payload limits", "Vendor rate limits"],
        failureScenarios=["Wrong sender wired for channel", "Vendor outage without fallback sender"],
        retry="Retry at sender with backoff; circuit-break bad vendors.",
        idempotency="Notification send needs dedupe key for at-least-once.",
        timeout="Sender HTTP ≤ 2s.",
        observability="notify_total{channel,vendor,result}",
        security="PII in templates; redact in logs.",
        performance="Bridge adds one hop — negligible vs network.",
        scalability="Swap vendors without redeploying channel code.",
        production="Config maps channel→sender; feature-flag vendor cutover.",
        mistakes=["Calling it Bridge when it is just Strategy"],
        antiPatterns=["Inheritance tree of channel×vendor"],
        alternatives=["Strategy for one axis", "Adapter for foreign shape only"],
        tradeoffs="Pros: independent evolution. Cons: more types to learn.",
        interviewQs=["Bridge vs Adapter?", "Bridge vs Strategy?"],
        trickyQs=["When is Bridge over-engineering?"],
        seniorFollowUps=["Multi-vendor failover — still Bridge?"],
    )
    add(
        p,
        id="composite",
        part=2,
        cat="structural",
        name="Composite",
        definition="Treat one payment and a tree of payments (salary bulk) with the same post()/total() interface.",
        problem="Call sites branch if (bulk) loop else pay — recursion and uniform ops disappear.",
        realWorld="OrderCompositeDemo / payroll: bulk NEFT of ₹2.1cr with 4,000 leaf credits; post() on the tree.",
        whyExists="Uniform interface over part-whole hierarchies.",
        ascii="BulkPayment (composite)\n  ├─ Credit leaf\n  ├─ Credit leaf\n  └─ Nested bulk…",
        flow="Client calls post() on root → composites recurse → leaves post money.",
        components=[
            ("PaymentComponent", "Common interface: post, total, reverse"),
            ("LeafPayment", "Single credit/debit"),
            ("BulkPayment", "Composite holding children"),
        ],
        javaCode="public interface PaymentComponent {\n  void post();\n  int totalPaise();\n}\npublic final class LeafPayment implements PaymentComponent {\n  private final int paise;\n  public void post() { /* book */ }\n  public int totalPaise() { return paise; }\n}\npublic final class BulkPayment implements PaymentComponent {\n  private final List<PaymentComponent> children = new ArrayList<>();\n  public void add(PaymentComponent c) { children.add(c); }\n  public void post() { children.forEach(PaymentComponent::post); }\n  public int totalPaise() {\n    return children.stream().mapToInt(PaymentComponent::totalPaise).sum();\n  }\n}",
        springCode="// Persist tree with parent_id; domain composite rebuilds on load.",
        unitTest="@Test void bulkTotalsChildren() {\n  BulkPayment b = new BulkPayment();\n  b.add(new LeafPayment(100)); b.add(new LeafPayment(50));\n  assertEquals(150, b.totalPaise());\n}",
        edgeCases=["Empty composite", "Cycles in tree", "Partial post failure mid-tree"],
        failureScenarios=["Leaf fails after siblings posted — need compensation", "Huge tree stack overflow"],
        retry="Idempotent leaf post; track per-leaf status in bulk job.",
        idempotency="Each leaf needs its own idempotency key.",
        timeout="Bulk job wall clock; per-leaf timeout bounded.",
        observability="composite_posts_total; leaf_failures; tree_depth",
        security="Authorize on root and sensitive leaves.",
        performance="Prefer iterative walk for deep/wide trees.",
        scalability="Stream children; do not load 4,000 into RAM if avoidable.",
        production="Salary files: composite + iterator + flyweight currency.",
        mistakes=["Composite without uniform interface (just a List)"],
        antiPatterns=["Recursion for flat lists"],
        alternatives=["Explicit batch job loop", "Iterator over flat file"],
        tradeoffs="Pros: uniform ops. Cons: error handling across tree is hard.",
        interviewQs=["Composite vs Decorator?", "How do you handle partial failure?"],
        trickyQs=["Should composite expose children publicly?"],
        seniorFollowUps=["Saga over composite children vs single DB txn?"],
    )
    add(
        p,
        id="decorator",
        part=2,
        cat="structural",
        name="Decorator",
        definition="Wrap a core PaymentProcessor with extra behavior (fraud, audit, metrics) without editing the core.",
        problem="Fraud/audit if-blocks inside ledger booking make the core untestable and rigid.",
        realWorld="PaymentDecoratorDemo: FraudDecorator → AuditDecorator → MetricsDecorator around PaymentProcessor.",
        whyExists="Same interface, stackable coats; compose at wiring time.",
        ascii="Client → MetricsDecorator → AuditDecorator → FraudDecorator → CoreProcessor",
        flow="Each decorator does work, then delegates to the next PaymentProcessor.",
        components=[
            ("PaymentProcessor", "Component interface"),
            ("CoreProcessor", "Books money only"),
            ("*Decorator", "Adds fraud/audit/metrics then delegates"),
        ],
        javaCode="public interface PaymentProcessor { Receipt process(Payment p); }\npublic final class FraudDecoratingProcessor implements PaymentProcessor {\n  private final PaymentProcessor next; private final FraudClient fraud;\n  public Receipt process(Payment p) {\n    if (!fraud.ok(p)) throw new FraudRejected();\n    return next.process(p);\n  }\n}",
        springCode="@Bean PaymentProcessor paymentProcessor(CoreProcessor core, FraudClient fraud, AuditLog audit) {\n  PaymentProcessor p = core;\n  p = new FraudDecoratingProcessor(p, fraud);\n  p = new AuditDecoratingProcessor(p, audit);\n  return new MetricsDecoratingProcessor(p);\n}",
        unitTest="@Test void fraudBlocksBeforeCore() {\n  PaymentProcessor core = mock(PaymentProcessor.class);\n  var d = new FraudDecoratingProcessor(core, amt -> false);\n  assertThrows(FraudRejected.class, () -> d.process(sample));\n  verifyNoInteractions(core);\n}",
        edgeCases=["Decorator order matters", "Exception swallowing", "Double-wrap metrics"],
        failureScenarios=["Audit decorator fails after money posted", "Fraud client timeout"],
        retry="Idempotent core; decorators must not double-charge on retry.",
        idempotency="Pass idempotency key through the whole chain.",
        timeout="Each decorator sets budget; fail-open vs fail-closed policy explicit.",
        observability="decorator_invocations{name}; wrap latency",
        security="Fraud fail-closed for high-risk; never log full PAN in audit decorator.",
        performance="Keep decorators allocation-light on hot path.",
        scalability="Stateless decorators scale with service.",
        production="Wire order in one @Bean method; document fail-open/closed.",
        mistakes=["Business rules inside decorator that belong in domain"],
        antiPatterns=["Decorator that sometimes does not call next (that is Proxy/Chain)"],
        alternatives=["Proxy for access control", "AOP @Around", "Middleware pipeline"],
        tradeoffs="Pros: OCP stacking. Cons: debugging deep stacks; order bugs.",
        interviewQs=["Decorator vs Proxy?", "Decorator vs Chain of Responsibility?"],
        trickyQs=["Where do you put transactional boundaries?"],
        seniorFollowUps=["AOP vs explicit decorators in a payment core?"],
    )
    add(
        p,
        id="facade",
        part=2,
        cat="structural",
        name="Facade",
        definition="One door (PaymentFacade.pay) that orchestrates fraud, account, charge, notify, audit.",
        problem="Mobile team should not know the choreography of eight internal services.",
        realWorld="PaymentFacadeDemo.processDetailed: fraud → account → charge → notify → audit.",
        whyExists="Hide subsystem complexity behind a stable, intention-revealing API.",
        ascii="App → PaymentFacade.pay()\n          ├─ FraudService\n          ├─ AccountService\n          ├─ PaymentService\n          ├─ NotificationService\n          └─ AuditService",
        flow="Single entry → ordered checks/side effects → coherent PaymentOutcome.",
        components=[
            ("PaymentFacade", "Orchestrates collaborators"),
            ("Subsystem services", "Fraud, account, charge, notify, audit"),
            ("Client", "Controller / mobile BFF"),
        ],
        javaCode="public final class PaymentFacade {\n  private final FraudService fraud = new FraudService();\n  private final AccountService account = new AccountService();\n  private final PaymentService payment = new PaymentService();\n  public PaymentOutcome processDetailed(String accountId, int amount) {\n    if (!fraud.ok(amount)) return new PaymentOutcome(\"rejected:fraud\", \"\", List.of(\"fraud\"));\n    if (!account.hasBalance(accountId)) return new PaymentOutcome(\"rejected:account\", \"\", List.of(\"account\"));\n    String ref = payment.charge(accountId, amount);\n    return new PaymentOutcome(\"success\", ref, List.of(\"fraud\", \"account\", \"charge\"));\n  }\n}",
        springCode="@Service\nclass PaymentFacade {\n  private final FraudService fraud; private final Ledger ledger; /* … */\n  public PaymentOutcome pay(PayRequest req) { /* orchestrate */ }\n}",
        unitTest="@Test void rejectsFraud() {\n  assertEquals(\"rejected:fraud\", facade.processDetailed(\"A1\", 9_999).status());\n}",
        edgeCases=["Partial success after charge", "Notify failure after money moved", "Duplicate pay clicks"],
        failureScenarios=["Subsystem timeout mid-flow", "Facade becomes god object"],
        retry="Idempotency key on pay; compensate notify failures asynchronously.",
        idempotency="Facade must accept Idempotency-Key and short-circuit duplicates.",
        timeout="Overall budget (e.g. 5s) with per-collaborator SLAs.",
        observability="facade_pay_total{result}; step latency breakdown",
        security="AuthZ at facade edge; do not expose internal services publicly.",
        performance="Avoid chatty N+1 inside facade — batch where possible.",
        scalability="Stateless facade; scale replicas; async side effects.",
        production="Keep facade thin — orchestrate, do not own all rules.",
        mistakes=["Putting HR + ATM + loans in one facade", "No idempotency"],
        antiPatterns=["FooFacade on every class"],
        alternatives=["API Gateway BFF", "Saga/orchestrator for distributed tx", "Mediator"],
        tradeoffs="Pros: simple client. Cons: central choke point if it grows.",
        interviewQs=["Facade vs Adapter?", "Facade vs Mediator?"],
        trickyQs=["How do you keep facade from becoming a god class?"],
        seniorFollowUps=["Sync facade vs async saga for checkout?"],
    )
    add(
        p,
        id="flyweight",
        part=2,
        cat="structural",
        name="Flyweight",
        definition="Share tiny immutable intrinsic state (Currency INR) across millions of extrinsic line items.",
        problem="10M statement lines each allocating new Currency(\"INR\") wastes RAM and GC.",
        realWorld="CurrencyFlyweightDemo: factory caches INR/USD/EUR; amount stays extrinsic on the line.",
        whyExists="Huge N sharing identical immutable metadata.",
        ascii="CurrencyFactory.get(\"INR\") ──► shared Currency flyweight\nStatementLine(amount, currencyRef)  // extrinsic + intrinsic ref",
        flow="Lookup/create flyweight by key → line holds reference + extrinsic amount.",
        components=[
            ("Flyweight (Currency)", "Intrinsic: code, decimals, symbol"),
            ("Factory cache", "Interns flyweights"),
            ("Context (line)", "Extrinsic amount / account"),
        ],
        javaCode="public final class Currency {\n  private final String code; private final int scale;\n  Currency(String code, int scale) { this.code = code; this.scale = scale; }\n}\npublic final class CurrencyFactory {\n  private final Map<String, Currency> cache = new ConcurrentHashMap<>();\n  public Currency get(String code) {\n    return cache.computeIfAbsent(code, c -> new Currency(c, scaleFor(c)));\n  }\n}",
        springCode="@Bean CurrencyFactory currencyFactory() { return new CurrencyFactory(); }",
        unitTest="@Test void sharesInr() {\n  var f = new CurrencyFactory();\n  assertSame(f.get(\"INR\"), f.get(\"INR\"));\n}",
        edgeCases=["Unknown currency code", "Mutable flyweight (bug)", "Cache unbounded growth"],
        failureScenarios=["Caching mutable account entities as flyweights", "Wrong scale for crypto"],
        retry="N/A",
        idempotency="get() idempotent.",
        timeout="N/A",
        observability="flyweight_cache_size; hit ratio",
        security="N/A beyond normal data.",
        performance="Major RAM win on statement/print jobs.",
        scalability="Cache per JVM; optional shared cache for huge catalogs.",
        production="Only immutable catalogs: currency, country, IFSC bank name.",
        mistakes=["Flyweight for balances", "No eviction policy for dynamic keys"],
        antiPatterns=["Calling every cache a Flyweight"],
        alternatives=["Enum for closed set", "DB reference data"],
        tradeoffs="Pros: memory. Cons: intrinsic/extrinsic discipline required.",
        interviewQs=["Intrinsic vs extrinsic?", "Flyweight vs cache?"],
        trickyQs=["Thread safety of the factory?"],
        seniorFollowUps=["Flyweight in JVM vs Redis interned reference data?"],
    )
    add(
        p,
        id="proxy",
        part=2,
        cat="structural",
        name="Proxy",
        definition="Stand in front of a real PaymentService to enforce auth, rate limit, lazy init, or caching.",
        problem="Core banking is dangerous/expensive; callers must not reach it unchecked.",
        realWorld="PaymentServiceProxyDemo + Spring Security / @Transactional proxies: gate before the real object.",
        whyExists="Control access or lifecycle without changing the subject’s code.",
        ascii="Client → PaymentServiceProxy (JWT, RPM)\n              │ allow?\n              ▼\n         RealPaymentService",
        flow="Proxy checks policy → delegates or rejects → never leaks real reference casually.",
        components=[
            ("PaymentService", "Subject interface"),
            ("RealPaymentService", "Core implementation"),
            ("PaymentServiceProxy", "Access control / lazy / cache"),
        ],
        javaCode="public interface PaymentService { Receipt pay(Payment p); }\npublic final class PaymentServiceProxy implements PaymentService {\n  private final PaymentService real; private final Auth auth; private final RateLimiter rl;\n  public Receipt pay(Payment p) {\n    auth.require(\"payments:write\");\n    if (!rl.tryAcquire(p.customerId())) throw new RateLimited();\n    return real.pay(p);\n  }\n}",
        springCode="// Spring Security MethodSecurityInterceptor and @Transactional are proxies.\n@PreAuthorize(\"hasAuthority('payments:write')\")\npublic Receipt pay(Payment p) { return real.pay(p); }",
        unitTest="@Test void blocksUnauthorized() {\n  assertThrows(SecurityException.class, () -> proxy.pay(sample));\n  verifyNoInteractions(real);\n}",
        edgeCases=["Proxy bypass via cast to concrete", "Lazy proxy init races", "Cache stampedes"],
        failureScenarios=["Auth service down — fail closed", "Rate limiter Redis blip"],
        retry="Do not retry 401/403; retry transient limiter errors carefully.",
        idempotency="Proxy forwards idempotency headers unchanged.",
        timeout="AuthZ check ≤ 100–200ms budget.",
        observability="proxy_rejections_total{reason}; auth latency",
        security="Least privilege; never log tokens.",
        performance="Local JWT validate when possible; cache JWKS.",
        scalability="Stateless proxy scales; rate limit needs shared store.",
        production="Prefer framework proxies; keep custom proxies thin.",
        mistakes=["Business GST rules inside proxy"],
        antiPatterns=["Proxy that always calls through and only logs (Decorator)"],
        alternatives=["API Gateway filters", "Decorator", "AOP"],
        tradeoffs="Pros: centralized control. Cons: hidden indirection; debugging.",
        interviewQs=["Proxy vs Decorator?", "Virtual vs protection vs remote proxy?"],
        trickyQs=["Can you cast through a JDK proxy?"],
        seniorFollowUps=["Mesh sidecar vs app-level proxy responsibilities?"],
    )

    # BEHAVIORAL ------------------------------------------------------------------
    add(
        p,
        id="chain-of-responsibility",
        part=3,
        cat="behavioral",
        name="Chain of Responsibility",
        definition="Pass a payment through KYC → AML → fraud → limit handlers; any may stop the chain.",
        problem="200-line if-else validation that cannot grow without merge conflicts.",
        realWorld="PaymentValidationChainDemo: ordered handlers approve/reject Priya’s ₹45,000.",
        whyExists="Independent checks that grow over time; open for new handlers.",
        ascii="KYC → AML → Fraud → DailyLimit → (approved)\n  │      │      │         │\n reject reject reject   reject",
        flow="Build chain → handle(request) → stop on reject or reach end.",
        components=[
            ("Handler", "canHandle / handle / next"),
            ("Concrete handlers", "KYC, AML, Fraud, Limit"),
            ("Chain builder", "Wires order"),
        ],
        javaCode="public abstract class PaymentHandler {\n  private PaymentHandler next;\n  public PaymentHandler link(PaymentHandler n) { this.next = n; return n; }\n  public final void handle(Payment p) {\n    if (!check(p)) throw new ValidationRejected(name());\n    if (next != null) next.handle(p);\n  }\n  protected abstract boolean check(Payment p);\n  protected abstract String name();\n}",
        springCode="@Bean PaymentHandler paymentValidationChain(List<PaymentHandler> ordered) {\n  // sort by @Order and link\n}",
        unitTest="@Test void stopsOnAml() {\n  assertThrows(ValidationRejected.class, () -> chain.handle(sanctionedPayee));\n}",
        edgeCases=["Empty chain", "Handler order wrong", "Handler throws unexpectedly"],
        failureScenarios=["Fraud service timeout in handler", "Silent pass-through bug"],
        retry="Do not retry business rejects; retry transient infra inside handler.",
        idempotency="Validation should be side-effect free or journaled.",
        timeout="Per-handler budget; overall chain deadline.",
        observability="validation_handler_total{handler,result}",
        security="Fail closed on AML/fraud errors for high risk.",
        performance="Short-circuit; avoid calling slow handlers when early reject.",
        scalability="Stateless handlers; shared policy cache.",
        production="Order via @Order; contract-test the chain.",
        mistakes=["Handlers with side effects that cannot roll back"],
        antiPatterns=["Chain that always runs everything like Decorator"],
        alternatives=["Decorator stack", "Rules engine", "Pipeline of functions"],
        tradeoffs="Pros: extensible checks. Cons: order sensitivity; harder tracing.",
        interviewQs=["Chain vs Decorator?", "Who decides the next handler?"],
        trickyQs=["Servlet filters — Chain of Responsibility?"],
        seniorFollowUps=["Sync chain vs async policy service?"],
    )
    add(
        p,
        id="command",
        part=3,
        cat="behavioral",
        name="Command",
        definition="Turn “debit Priya ₹45,000” into an object you can queue, retry, audit, and undo.",
        problem="Void method calls vanish on timeout — no idempotent retry or audit trail.",
        realWorld="PaymentCommandDemo: DebitCommand with execute; queue/retry with idempotency key.",
        whyExists="Actions need a life: schedule, audit, compensate.",
        ascii="DebitCommand{key, account, amount}\n     │ execute()\n     ▼\n Ledger + Outbox / queue",
        flow="Build command → persist/queue → worker execute → record result.",
        components=[
            ("Command", "execute / optionally undo"),
            ("Invoker / queue", "Runs commands"),
            ("Receiver", "Ledger / payment service"),
        ],
        javaCode="public interface PaymentCommand { void execute(); }\npublic final class DebitCommand implements PaymentCommand {\n  private final String idempotencyKey; private final Ledger ledger;\n  private final String account; private final int amount;\n  public void execute() { ledger.debit(idempotencyKey, account, amount); }\n}",
        springCode="// Outbox row = serialized command; worker deserializes and execute().",
        unitTest="@Test void debitIsIdempotent() {\n  cmd.execute(); cmd.execute();\n  assertEquals(1, ledger.debitCount(account));\n}",
        edgeCases=["Partial execute", "Undo after side effects escaped", "Poison message"],
        failureScenarios=["Worker crash after side effect before ack", "Duplicate delivery"],
        retry="At-least-once with idempotent execute.",
        idempotency="Idempotency key is part of the command.",
        timeout="Worker visibility timeout > max execute time.",
        observability="command_execute_total{type,result}; queue lag",
        security="Authorize before enqueue and at execute.",
        performance="Batch commands where safe.",
        scalability="Compete consumers on command queue.",
        production="Prefer outbox + consumer over in-memory queue for money.",
        mistakes=["Command without idempotency for money"],
        antiPatterns=["Command that is just a void service method rename"],
        alternatives=["Domain events", "Saga steps", "Job framework"],
        tradeoffs="Pros: retry/audit. Cons: more moving parts.",
        interviewQs=["Command vs event?", "Do you need undo in banking?"],
        trickyQs=["Command in CQRS write side?"],
        seniorFollowUps=["Outbox command vs Kafka event naming?"],
    )
    add(
        p,
        id="interpreter",
        part=3,
        cat="behavioral",
        name="Interpreter",
        definition="Evaluate a tiny rule language (amount > 50000 AND newPayee) against a payment context.",
        problem="Compliance wants new rules without waiting for a full release cycle.",
        realWorld="TransactionRuleInterpreterDemo: expression tree over payment attributes.",
        whyExists="Small DSLs that business can own — not a full rules engine.",
        ascii="AND\n ├─ GT(amount, 50000)\n └─ EQ(newPayee, true)\n        │ evaluate(ctx)\n        ▼ true/false",
        flow="Parse/build AST → evaluate against PaymentContext → allow/step-up.",
        components=[
            ("Expression", "interpret(context)"),
            ("Terminal exprs", "amount, flags"),
            ("Non-terminal", "AND/OR/NOT"),
        ],
        javaCode="public interface Expr { boolean eval(PaymentContext ctx); }\npublic record GtAmount(int threshold) implements Expr {\n  public boolean eval(PaymentContext ctx) { return ctx.amount() > threshold; }\n}\npublic record And(Expr left, Expr right) implements Expr {\n  public boolean eval(PaymentContext ctx) { return left.eval(ctx) && right.eval(ctx); }\n}",
        springCode="// Store rule AST as JSON; version rules; canary new versions.",
        unitTest="@Test void stepUpForNewPayeeLarge() {\n  Expr rule = new And(new GtAmount(50_000), new Flag(\"newPayee\"));\n  assertTrue(rule.eval(ctx(60_000, true)));\n}",
        edgeCases=["Empty expression", "Unknown identifier", "Short-circuit OR/AND"],
        failureScenarios=["Grammar grows into accidental compiler", "Unsafe eval of user code"],
        retry="N/A — pure evaluation.",
        idempotency="eval is pure.",
        timeout="Bound eval time; reject huge ASTs.",
        observability="rule_eval_total{ruleId,result}",
        security="Never eval arbitrary scripts; allowlisted AST nodes only.",
        performance="Compile/cache AST; avoid re-parse per payment.",
        scalability="Stateless evaluators.",
        production="Versioned rules; audit which ruleId fired.",
        mistakes=["Parsing English prose", "Building Drools accidentally"],
        antiPatterns=["Interpreter for SQL joins across 12 tables"],
        alternatives=["Drools/Easy Rules", "Feature flags", "Hard-coded policy"],
        tradeoffs="Pros: business agility. Cons: DSL maintenance cost.",
        interviewQs=["Interpreter vs Strategy?", "When to buy a rules engine?"],
        trickyQs=["Security of expression evaluation?"],
        seniorFollowUps=["Rule versioning and replay for disputes?"],
    )
    add(
        p,
        id="iterator",
        part=3,
        cat="behavioral",
        name="Iterator",
        definition="Walk salary credits without exposing whether storage is CSV, DB cursor, or S3 stream.",
        problem="Loading List of 4,000 credits OOMs the batch box; posting loop couples to ArrayList.",
        realWorld="TransactionIteratorDemo: hasNext/next over transactions; posting loop stays stable.",
        whyExists="Separate traversal from storage representation.",
        ascii="PostingJob\n  while (it.hasNext()) post(it.next())\n         │\n   FileIterator | DbCursorIterator | S3Iterator",
        flow="Obtain iterator → consume → close resources in finally/try-with-resources.",
        components=[
            ("Iterator", "hasNext/next"),
            ("Iterable source", "File / DB / API pages"),
            ("Consumer", "Posting loop"),
        ],
        javaCode="public final class FileCreditIterator implements Iterator<Credit> {\n  private final BufferedReader reader; private String nextLine;\n  public boolean hasNext() { /* peek */ return nextLine != null; }\n  public Credit next() { return Credit.parse(nextLine); }\n}",
        springCode="// Spring Data Page / Stream; always close ResultSet/Stream.",
        unitTest="@Test void postsAll() {\n  int n = 0; for (Credit c : credits) { post(c); n++; }\n  assertEquals(3, n);\n}",
        edgeCases=["Empty source", "Malformed mid-stream", "Fail to close cursor"],
        failureScenarios=["OOM from accidental collect(toList)", "Cursor timeout"],
        retry="Checkpoint offset; resume iterator from last ack.",
        idempotency="Each credit post keyed.",
        timeout="Statement/query timeout; job deadline.",
        observability="iterator_items_total; lag; errors",
        security="Authorize file/path access.",
        performance="Streaming beats materializing.",
        scalability="Partition files across workers.",
        production="Prefer JDK Iterator/Stream; do not invent for ArrayList.",
        mistakes=["Custom iterator over in-memory List for fashion"],
        antiPatterns=["Exposing internal array to callers"],
        alternatives=["Java Stream", "Reactive Flux", "Spring Batch reader"],
        tradeoffs="Pros: storage freedom. Cons: resource lifecycle discipline.",
        interviewQs=["Iterator vs Stream?", "Fail-fast iterators?"],
        trickyQs=["Concurrent modification during iteration?"],
        seniorFollowUps=["Exactly-once batch with iterator checkpoints?"],
    )
    add(
        p,
        id="mediator",
        part=3,
        cat="behavioral",
        name="Mediator",
        definition="Route colleague services through a settlement hub so fraud/ledger/notify do not import each other.",
        problem="Spaghetti cycles: fraud→ledger→notify→fraud.",
        realWorld="OrderProcessingMediatorDemo: mediator coordinates order steps; colleagues know only the hub.",
        whyExists="Centralize complex interaction; reduce N×N coupling.",
        ascii="Fraud ─┐\nLedger ─┼→ SettlementMediator\nNotify ─┘",
        flow="Event to mediator → mediator calls colleagues in order → colleagues never call peers.",
        components=[
            ("Mediator", "Orchestrates conversation"),
            ("Colleagues", "Fraud, ledger, notify"),
            ("Client", "Starts the flow"),
        ],
        javaCode="public final class SettlementMediator {\n  private final FraudService fraud; private final Ledger ledger; private final Notify notify;\n  public void onAuthorized(Payment p) {\n    fraud.record(p);\n    ledger.post(p);\n    notify.sms(p);\n  }\n}",
        springCode="// @Service mediator; or Camunda/Temporal for long-running mediation.",
        unitTest="@Test void postsThenNotifies() {\n  mediator.onAuthorized(p);\n  inOrder.verify(ledger).post(p);\n  inOrder.verify(notify).sms(p);\n}",
        edgeCases=["Mediator god object", "Sync vs async colleagues", "Partial failure"],
        failureScenarios=["Notify fails after post — need outbox", "Deadlock if colleagues callback incorrectly"],
        retry="Outbox for side effects; idempotent colleague APIs.",
        idempotency="Mediator entry keyed by payment id.",
        timeout="Overall orchestration budget.",
        observability="mediator_flows_total{flow,result}; step spans",
        security="AuthZ at mediator entry.",
        performance="Avoid chatty sync fan-out; parallelize independent steps.",
        scalability="Stateless mediator + durable workflow engine for long sagas.",
        production="Split mediators by bounded context when hub grows.",
        mistakes=["Mediator that knows the whole bank"],
        antiPatterns=["Mediator for two services that should call directly"],
        alternatives=["Observer (broadcast)", "Saga orchestrator", "Facade"],
        tradeoffs="Pros: decoupled colleagues. Cons: hub complexity.",
        interviewQs=["Mediator vs Observer?", "Mediator vs Facade?"],
        trickyQs=["Is Kafka a mediator?"],
        seniorFollowUps=["In-proc mediator vs Temporal workflow?"],
    )
    add(
        p,
        id="memento",
        part=3,
        cat="behavioral",
        name="Memento",
        definition="Snapshot and restore an object’s state (fee table) without breaking encapsulation.",
        problem="Ops published bad NEFT fees at 10:02; need restore to 09:55 without exposing internals.",
        realWorld="PaymentConfigurationMementoDemo: caretaker stores opaque mementos; originator restores.",
        whyExists="In-model undo for carefully sized objects.",
        ascii="FeeEngine (originator)\n    │ createMemento() / restore()\nCaretaker list[m0,m1,m2]",
        flow="Before change → memento → mutate → on bad publish restore previous.",
        components=[
            ("Originator", "FeeEngine — only one who reads memento guts"),
            ("Memento", "Opaque snapshot"),
            ("Caretaker", "Stores history"),
        ],
        javaCode="public final class FeeEngine {\n  private Map<String, Integer> fees;\n  public Memento snapshot() { return new Memento(Map.copyOf(fees)); }\n  public void restore(Memento m) { this.fees = new HashMap<>(m.state()); }\n  public static final class Memento {\n    private final Map<String, Integer> state;\n    private Memento(Map<String, Integer> s) { this.state = s; }\n    private Map<String, Integer> state() { return state; }\n  }\n}",
        springCode="// Versioned JSON in DB; only FeeEngine deserializes.",
        unitTest="@Test void rollback() {\n  var m = engine.snapshot();\n  engine.set(\"NEFT\", 0);\n  engine.restore(m);\n  assertEquals(500, engine.get(\"NEFT\"));\n}",
        edgeCases=["Huge object graphs", "Memento leaks internals via public getters", "Clock skew on versions"],
        failureScenarios=["Restore wrong version", "Partial restore"],
        retry="N/A",
        idempotency="restore to same memento is idempotent.",
        timeout="N/A",
        observability="memento_restore_total{originator}",
        security="Mementos may contain sensitive config — encrypt at rest.",
        performance="Snapshot cost grows with state size.",
        scalability="Not for whole-bank state — use event sourcing.",
        production="Bound what is snapshottable; prefer audit+event sourcing for money.",
        mistakes=["Public memento fields", "Snapshotting mutable shared refs"],
        antiPatterns=["Calling DB backups Memento"],
        alternatives=["Event sourcing", "Git-like config repo", "Audit log only"],
        tradeoffs="Pros: clean undo. Cons: memory/version management.",
        interviewQs=["Memento vs serializable DTO?", "Memento vs event sourcing?"],
        trickyQs=["How does Java module/encapsulation help?"],
        seniorFollowUps=["Fee config rollback vs ledger compensating tx?"],
    )
    add(
        p,
        id="observer",
        part=3,
        cat="behavioral",
        name="Observer",
        definition="Publish PaymentPosted once; SMS, email, analytics, MIS listeners react independently.",
        problem="Ledger importing NotifyService creates brittle coupling and transactional confusion.",
        realWorld="PaymentObserverDemo + Kafka: listeners fan out; posting must not roll back if SMS fails.",
        whyExists="One fact, many independent reactions.",
        ascii="Ledger ─publish→ PaymentPosted\n                    ├─ NotifyListener\n                    ├─ ProjectionListener\n                    └─ MisFileListener",
        flow="State change → event → observers handle asynchronously / in-process.",
        components=[
            ("Subject", "Payment service / event bus"),
            ("Event", "PaymentPosted"),
            ("Observers", "Notify, projection, MIS"),
        ],
        javaCode="public interface PaymentListener { void onPosted(PaymentPosted e); }\npublic final class PaymentSubject {\n  private final List<PaymentListener> listeners = new CopyOnWriteArrayList<>();\n  public void subscribe(PaymentListener l) { listeners.add(l); }\n  public void post(Payment p) {\n    // persist…\n    var e = new PaymentPosted(p.id());\n    listeners.forEach(l -> l.onPosted(e));\n  }\n}",
        springCode="@TransactionalEventListener(phase = AFTER_COMMIT)\nvoid onPosted(PaymentPosted e) { notifyService.sms(e); }\n// Production: Kafka topic payment.posted",
        unitTest="@Test void fansOut() {\n  subject.subscribe(sms); subject.subscribe(mis);\n  subject.post(p);\n  verify(sms).onPosted(any()); verify(mis).onPosted(any());\n}",
        edgeCases=["Listener throws", "Ordering of listeners", "Re-entrancy"],
        failureScenarios=["SMS fails — must not undo money", "Duplicate events at-least-once"],
        retry="Per-listener retry + DLQ; never couple to publisher txn after commit.",
        idempotency="Listeners idempotent on event id.",
        timeout="Listener processing budgets; Kafka max.poll.interval.",
        observability="events_published; consumer lag; listener errors",
        security="Events without secrets; authorize consumers.",
        performance="Async fan-out; batch where possible.",
        scalability="Kafka consumer groups per listener type.",
        production="AFTER_COMMIT + outbox → Kafka is grown-up Observer.",
        mistakes=["Doing critical sync work in observer that must be atomic with post"],
        antiPatterns=["Observer as a fake mediator conversation"],
        alternatives=["Mediator", "Explicit facade calls", "CDC"],
        tradeoffs="Pros: decoupling. Cons: eventual consistency complexity.",
        interviewQs=["Observer vs Mediator?", "In-process vs Kafka?"],
        trickyQs=["Transactional EventListener pitfalls?"],
        seniorFollowUps=["Outbox pattern with Observer semantics?"],
    )
    add(
        p,
        id="state",
        part=3,
        cat="behavioral",
        name="State",
        definition="Payment behavior follows lifecycle: CREATED → AUTHORIZED → POSTED → SETTLED; illegal ops throw.",
        problem="Giant switch on status enum scattered across services; illegal refunds slip through.",
        realWorld="PaymentStateDemo: each state object implements legal verbs; refund illegal in CREATED.",
        whyExists="Make illegal transitions impossible by construction.",
        ascii="CREATED ─authorize→ AUTHORIZED ─post→ POSTED ─settle→ SETTLED\n   │ refund? NO              │ refund? YES",
        flow="Context holds State → method delegates to state → state may transition context.",
        components=[
            ("PaymentContext", "Holds current state"),
            ("State interface", "authorize/post/refund"),
            ("Concrete states", "Created/Authorized/Posted/Settled"),
        ],
        javaCode="public interface PaymentState {\n  void authorize(PaymentContext ctx);\n  void refund(PaymentContext ctx);\n}\npublic final class CreatedState implements PaymentState {\n  public void authorize(PaymentContext ctx) { ctx.setState(new AuthorizedState()); }\n  public void refund(PaymentContext ctx) { throw new IllegalStateException(\"CREATED\"); }\n}",
        springCode="// Persist status enum; rebuild state object on load via factory.",
        unitTest="@Test void cannotRefundCreated() {\n  assertThrows(IllegalStateException.class, () -> payment.refund());\n}",
        edgeCases=["Concurrent transitions", "Persisting state vs object", "Compensating transitions"],
        failureScenarios=["DB status updated without state object", "Lost update on concurrent authorize"],
        retry="Optimistic locking on status version.",
        idempotency="authorize twice from CREATED should be safe (already AUTHORIZED).",
        timeout="N/A for in-memory; rail calls have timeouts.",
        observability="payment_state_transitions_total{from,to}",
        security="AuthZ per verb (refund vs authorize).",
        performance="State objects can be flyweight singletons if immutable.",
        scalability="Status in DB; horizontal services with locking.",
        production="Pair with optimistic locking / conditional updates.",
        mistakes=["Enum alone without behavior encapsulation"],
        antiPatterns=["State machine library for a boolean"],
        alternatives=["Strategy (you pick algorithm)", "XState/external FSM"],
        tradeoffs="Pros: safe lifecycle. Cons: more classes; persistence mapping.",
        interviewQs=["State vs Strategy?", "How do you persist State?"],
        trickyQs=["Null Object state?"],
        seniorFollowUps=["Distributed state machine across microservices?"],
    )
    add(
        p,
        id="strategy",
        part=3,
        cat="behavioral",
        name="Strategy",
        definition="Swap interchangeable algorithms for the same verb — UPI vs Card vs PayPal payment processing.",
        problem="Sprawling switch on method codes inside one service method.",
        realWorld="PaymentStrategyDemo: PaymentMethodRouter EnumMap → Upi/Card/Paypal/BankTransfer strategies.",
        whyExists="OCP for algorithms; context stays stable.",
        ascii="PaymentService.process(method, request)\n        │\n  EnumMap → PaymentStrategy.pay()",
        flow="Resolve strategy from method → validate capabilities → pay().",
        components=[
            ("PaymentStrategy", "Algorithm interface"),
            ("Concrete strategies", "UPI/Card/PayPal/Bank"),
            ("Router / context", "Selects strategy"),
        ],
        javaCode="public interface PaymentStrategy {\n  PaymentReceipt pay(PaymentRequest request);\n  boolean supportsRecurring();\n}\npublic final class PaymentMethodRouter {\n  private final Map<PaymentMethod, PaymentStrategy> strategies = new EnumMap<>(PaymentMethod.class);\n  public PaymentStrategy resolve(PaymentMethod method) { return strategies.get(method); }\n}",
        springCode="@Component\nclass PaymentStrategies {\n  private final Map<PaymentMethod, PaymentStrategy> map;\n  PaymentStrategies(List<PaymentStrategy> all) { /* index */ }\n}",
        unitTest="@Test void rejectsRecurringUpi() {\n  assertThrows(IllegalArgumentException.class,\n    () -> service.process(UPI, recurringRequest));\n}",
        edgeCases=["Unknown method", "Null strategy registration", "Strategy with state"],
        failureScenarios=["Missing bean for new rail", "Strategy throws after partial side effect"],
        retry="Per-strategy idempotency keys.",
        idempotency="Strategies must honor idempotency for money.",
        timeout="Per-rail timeouts differ (UPI vs NEFT file).",
        observability="strategy_pay_total{method,result}",
        security="PCI scope isolation for card strategy.",
        performance="O(1) map dispatch.",
        scalability="Stateless strategies.",
        production="Register via Spring; fail on unknown keys.",
        mistakes=["Stateful strategies shared across requests"],
        antiPatterns=["Interface with one implementation forever"],
        alternatives=["Factory Method", "Template Method", "State"],
        tradeoffs="Pros: clean OCP. Cons: indirection for simple cases.",
        interviewQs=["Strategy vs State?", "Strategy vs Template Method?"],
        trickyQs=["Strategy vs polymorphism alone?"],
        seniorFollowUps=["Pricing + FX + rail — nested strategies?"],
    )
    add(
        p,
        id="template-method",
        part=3,
        cat="behavioral",
        name="Template Method",
        definition="Fix the skeleton validate → book → notify; subclasses fill book() for NEFT vs RTGS.",
        problem="Every clearing run must enforce the same policy order; free-form inheritance skips validate.",
        realWorld="PaymentProcessingTemplateDemo: final execute() calls steps; subclasses override hooks.",
        whyExists="Regulation/policy is the skeleton; product only fills chapters.",
        ascii="ClearingJob.execute() [final]\n  1 validate()\n  2 book()      ← subclass\n  3 notify()",
        flow="Base final method calls overridable steps in fixed order.",
        components=[
            ("AbstractClearingJob", "Template with final execute"),
            ("NeftClearingJob", "Implements book via file"),
            ("RtgsClearingJob", "Implements book via wire"),
        ],
        javaCode="public abstract class ClearingJob {\n  public final void execute() {\n    validate();\n    book();\n    notifyParties();\n  }\n  protected void validate() { /* common */ }\n  protected abstract void book();\n  protected void notifyParties() { /* common */ }\n}",
        springCode="// Prefer composition pipelines if skeleton itself changes often.",
        unitTest="@Test void cannotSkipValidate() {\n  // execute() always calls validate before book — verified via spy\n}",
        edgeCases=["Hook called twice", "Subclass breaking LSP", "Too many hooks"],
        failureScenarios=["Inheritance fight when skeleton changes", "Hidden side effects in base"],
        retry="Idempotent book step.",
        idempotency="execute keyed by job run id.",
        timeout="Job deadline around execute().",
        observability="clearing_job_steps{step,result}",
        security="Common validate enforces policy.",
        performance="Fine for batch.",
        scalability="One job instance per partition.",
        production="If skeleton churns, switch to Strategy/pipeline.",
        mistakes=["Forcing inheritance when Strategy fits"],
        antiPatterns=["Template with 20 empty hooks"],
        alternatives=["Strategy for whole algorithm", "Pipeline of functions"],
        tradeoffs="Pros: enforced policy. Cons: brittle inheritance.",
        interviewQs=["Template Method vs Strategy?", "Hollywood principle?"],
        trickyQs=["Java HttpServlet — Template Method?"],
        seniorFollowUps=["Replace inheritance template with composable steps?"],
    )
    add(
        p,
        id="visitor",
        part=3,
        cat="behavioral",
        name="Visitor",
        definition="Add new operations (GST, TDS, audit PDF) over a stable account type hierarchy via double dispatch.",
        problem="Reports multiply monthly; editing Savings/Loan/Card for each report is painful.",
        realWorld="AccountVisitorDemo: account.accept(visitor) for GST/audit/statement visitors.",
        whyExists="Stable types, exploding operations — add visitors, not product classes.",
        ascii="Savings.accept(GstVisitor)\nLoan.accept(GstVisitor)\nCard.accept(GstVisitor)",
        flow="Client picks visitor → elements accept → visitor.visitConcrete(element).",
        components=[
            ("Visitor", "visitSavings/visitLoan/…"),
            ("Element", "accept(Visitor)"),
            ("Concrete visitors", "GST, TDS, Audit"),
        ],
        javaCode="public interface AccountVisitor {\n  void visit(Savings a);\n  void visit(Loan a);\n}\npublic interface Account {\n  void accept(AccountVisitor v);\n}\npublic final class Savings implements Account {\n  public void accept(AccountVisitor v) { v.visit(this); }\n}",
        springCode="// Register visitors as @Component; run month-end job per visitor.",
        unitTest="@Test void gstVisitsSavings() {\n  var v = new GstVisitor();\n  savings.accept(v);\n  assertTrue(v.sawSavings());\n}",
        edgeCases=["New account type breaks all visitors", "Visitor with mutable shared state", "Null element"],
        failureScenarios=["Adding product types weekly — Visitor tax", "Partial visitor run"],
        retry="Restart month-end visitor job idempotently.",
        idempotency="Visitor outputs keyed by period+account.",
        timeout="Batch window for month-end.",
        observability="visitor_accounts_total{visitor,type}",
        security="Authorize report generation.",
        performance="Single walk per visitor; or combined visitors carefully.",
        scalability="Partition accounts across workers.",
        production="Use when types are stable; otherwise ordinary methods.",
        mistakes=["Visitor when types change more than ops"],
        antiPatterns=["Visitor for one operation on one type"],
        alternatives=["Pattern matching switch (Java 21)", "Sealed interfaces + methods"],
        tradeoffs="Pros: easy new ops. Cons: hard new types.",
        interviewQs=["When is Visitor worth it?", "Double dispatch explained?"],
        trickyQs=["Visitor vs pattern matching in modern Java?"],
        seniorFollowUps=["Sealed account hierarchy + switch vs classic Visitor?"],
    )

    assert len(p) == 23, len(p)
    return p


def write_module(name: str, const_name: str, part: int, items: list[dict]):
    body = ",\n".join(card_ts(x) for x in items)
    text = f'''import type {{PatternCard}} from './types';
import {{gofCard}} from './card';

/** GoF {name} patterns (Part {part}). */
export const {const_name}: PatternCard[] = [
{body},
];
'''
    (OUT / f"{name}.ts").write_text(text)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    patterns = all_patterns()

    (OUT / "types.ts").write_text(
        "export type {PatternCard, PatternFrequency, TocItem, InterviewQ, MatrixRow, DecisionTree} from '@/lib/microservices-patterns/types';\n"
    )
    (OUT / "card.ts").write_text(
        '''import type {PatternCard} from './types';

/** Identity helper so catalog modules stay typed without sprawling casts. */
export function gofCard(card: PatternCard): PatternCard {
  return card;
}
'''
    )

    creational = [x for x in patterns if x["cat"] == "creational"]
    structural = [x for x in patterns if x["cat"] == "structural"]
    behavioral = [x for x in patterns if x["cat"] == "behavioral"]
    write_module("creational", "CREATIONAL_PATTERNS", 1, creational)
    write_module("structural", "STRUCTURAL_PATTERNS", 2, structural)
    write_module("behavioral", "BEHAVIORAL_PATTERNS", 3, behavioral)

    (OUT / "catalog.ts").write_text(
        '''import type {PatternCard} from './types';
import {CREATIONAL_PATTERNS} from './creational';
import {STRUCTURAL_PATTERNS} from './structural';
import {BEHAVIORAL_PATTERNS} from './behavioral';
import {MASTER_STORY} from '@/lib/design-patterns-stories';

export type PatternGroup = {
  id: string;
  part: number;
  title: string;
  lead: string;
  patterns: PatternCard[];
};

export const PATTERN_GROUPS: PatternGroup[] = [
  {
    id: 'creational',
    part: 1,
    title: 'Creational (5)',
    lead: 'How the bank is allowed to create objects — rails, kits, forms, templates, the one calendar.',
    patterns: CREATIONAL_PATTERNS,
  },
  {
    id: 'structural',
    part: 2,
    title: 'Structural (7)',
    lead: 'How the bank is wired — doors, coats, translators, trees, shared catalogs, guards.',
    patterns: STRUCTURAL_PATTERNS,
  },
  {
    id: 'behavioral',
    part: 3,
    title: 'Behavioral (11)',
    lead: 'How the bank talks and decides — pipelines, events, lifecycle, algorithms, reports.',
    patterns: BEHAVIORAL_PATTERNS,
  },
];

export const ALL_PATTERNS: PatternCard[] = PATTERN_GROUPS.flatMap((g) => g.patterns);

export const MEMORY_STORY = MASTER_STORY;

export const GOF_ASCII = `
                    ┌──────────── GoF 23 ────────────┐
 Creational (5)     │ Singleton Factory AbstractFactory │
                    │ Builder Prototype                 │
 Structural (7)     │ Adapter Bridge Composite          │
                    │ Decorator Facade Flyweight Proxy  │
 Behavioral (11)    │ Chain Command Interpreter Iterator│
                    │ Mediator Memento Observer State   │
                    │ Strategy TemplateMethod Visitor   │
                    └───────────────────────────────────┘
         One Meridian Bank payment threads all 23
`;

export const LAB_RUNBOOK = [
  'cd java-design-patterns-real-world && mvn -q test',
  'mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.DesignPatternDemo',
  'Open Deep lab → on any card for the matching *Demo.java in the source explorer',
  'Revision stories + mock interview linked from /design-patterns',
];
'''
    )

    (OUT / "toc.ts").write_text(
        '''import type {TocItem} from './types';

export const GOF_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview'},
  {id: 'creational', label: '01. Creational (5)'},
  {id: 'structural', label: '02. Structural (7)'},
  {id: 'behavioral', label: '03. Behavioral (11)'},
  {id: 'matrix', label: '04. Decision matrix'},
  {id: 'twins', label: '05. Confused twins'},
  {id: 'interview', label: '06. Interview bank'},
  {id: 'lab', label: '07. Runnable lab'},
];

export const MEMORY_SENTENCE =
  'One Meridian Bank rent payment · 23 GoF patterns · Why → Architecture → Code → Failures → Ops → Interview.';

export const VERSION_NOTE =
  'Java 21 demos in java-design-patterns-real-world/ · Spring notes where DI replaces hand-rolled wiring · same UX as Microservices Patterns.';
'''
    )

    (OUT / "decisions.ts").write_text(
        '''import type {DecisionTree, MatrixRow} from './types';
import {CONFUSED_TWINS, PURPOSE_WALL} from '@/lib/design-patterns-stories';

export const DECISION_TREES: DecisionTree[] = [
  {
    id: 'create-or-not',
    title: 'Need a new object?',
    ascii: `Need object?
  ├─ type varies (UPI/NEFT) → Factory Method
  ├─ whole kit must match (IN/US) → Abstract Factory
  ├─ many optionals → Builder
  ├─ clone template → Prototype
  └─ truly one process global → Singleton (prefer Spring bean)`,
  },
  {
    id: 'wire-or-guard',
    title: 'Wiring shape?',
    ascii: `Foreign API shape? → Adapter
Many internals, one door? → Facade
Gate before real object? → Proxy
Extra coat always calls through? → Decorator
Two axes (channel×vendor)? → Bridge
Tree one/many same op? → Composite
Share tiny immutable? → Flyweight`,
  },
  {
    id: 'talk-or-decide',
    title: 'Behavior?',
    ascii: `Pipeline may stop? → Chain
Action is a queueable object? → Command
Tiny rule language? → Interpreter
Walk without exposing storage? → Iterator
Hub conversation? → Mediator
Snapshot/restore? → Memento
Broadcast event? → Observer
Lifecycle verbs? → State
Swap algorithm? → Strategy
Fixed skeleton? → Template Method
New report on stable types? → Visitor`,
  },
];

export const PATTERN_MATRIX: MatrixRow[] = PURPOSE_WALL.map((p) => ({
  pattern: p.name,
  problem: p.purpose,
  solution: p.purpose,
  tradeoff: 'See card trade-offs',
  interviewQ: `Explain ${p.name} with a payment example`,
}));

export const CHEAT_SHEET = PURPOSE_WALL.map((p) => `${p.name}: ${p.purpose}`).join('\\n');

export const TWINS = CONFUSED_TWINS;
'''
    )

    (OUT / "interview.ts").write_text(
        '''import type {InterviewQ} from './types';

const q = (
  partial: Omit<InterviewQ, 'id'> & {id?: string},
  i: number,
): InterviewQ => ({
  id: partial.id ?? `gof-q-${i}`,
  ...partial,
});

const RAW: Omit<InterviewQ, 'id'>[] = [
  {
    level: 'basic',
    topic: 'Creational',
    question: 'What problem does Factory Method solve that new Concrete() does not?',
    answer30s: 'Callers depend on an interface; the factory picks the concrete rail/gateway.',
    answer2m:
      'In payments, controllers should not new UpiGateway(). Factory Method maps method=UPI|NEFT to PaymentGateway. Adding IMPS is one class + registry entry. That is OCP for object creation.',
    followUps: ['Factory Method vs Simple Factory?', 'Factory vs Strategy?'],
    wrongAnswer: 'Factory is just a place to put constructors for style.',
  },
  {
    level: 'basic',
    topic: 'Structural',
    question: 'Adapter vs Facade in one sentence each.',
    answer30s: 'Adapter translates one foreign API; Facade hides many of our APIs behind one door.',
    answer2m:
      'NPCI SDK → PaymentGateway is Adapter. PaymentFacade.pay calling fraud+ledger+notify is Facade. Interviewers listen for translate vs hide.',
    followUps: ['When do you skip Adapter?', 'God facade smell?'],
    wrongAnswer: 'They are the same — both wrap stuff.',
  },
  {
    level: 'intermediate',
    topic: 'Structural',
    question: 'Proxy vs Decorator — gate vs coat.',
    answer30s: 'Proxy may refuse the call; Decorator almost always calls through and adds work.',
    answer2m:
      'Auth/rate-limit before ledger is Proxy. Fraud scoring then delegate is Decorator. Spring @Transactional is a proxy. Mixing the names loses the access-control intent.',
    followUps: ['Virtual proxy example?', 'AOP vs explicit decorator?'],
    wrongAnswer: 'Decorator checks JWT.',
    trick: 'If the wrapper’s primary job is “no,” it is Proxy.',
  },
  {
    level: 'intermediate',
    topic: 'Behavioral',
    question: 'Strategy vs State with a payment example.',
    answer30s: 'Strategy: you pick UPI vs card. State: lifecycle picks what verbs are legal.',
    answer2m:
      'PaymentStrategy.pay swaps algorithms. PaymentState makes refund illegal in CREATED. Mixing them produces switch soup on both method and status.',
    followUps: ['How do you persist State?', 'Strategy registry in Spring?'],
    wrongAnswer: 'State is just an enum field.',
  },
  {
    level: 'senior',
    topic: 'Behavioral',
    question: 'How do you implement Observer for PaymentPosted without rolling back money when SMS fails?',
    answer30s: 'Publish after commit (outbox → Kafka); listeners idempotent; SMS failures go to retry/DLQ.',
    answer2m:
      'In-process listeners inside the DB transaction couple notify to money. Use AFTER_COMMIT or transactional outbox. Consumers use event id idempotency. That is grown-up Observer.',
    followUps: ['Outbox vs CDC?', 'Mediator vs Observer here?'],
    wrongAnswer: 'Call NotifyService synchronously inside ledger.post txn.',
    trick: 'At-least-once delivery requires idempotent listeners.',
  },
  {
    level: 'senior',
    topic: 'Creational',
    question: 'When is Abstract Factory worth it over Factory Method?',
    answer30s: 'When a region/product line must create several objects that only make sense together.',
    answer2m:
      'India pack: INR + UPI + RBI. US pack: USD + ACH + Fed. Factory Method picks one rail; Abstract Factory prevents UPI+USD ledger mixes by construction.',
    followUps: ['How do you test family invariants?', 'Profiles per region?'],
    wrongAnswer: 'Always use Abstract Factory for every factory.',
  },
  {
    level: 'lead',
    topic: 'Structural',
    question: 'Composite salary file posts 4,000 leaves — design partial failure.',
    answer30s: 'Per-leaf idempotency + status; compensate or resume; do not pretend one DB txn across rails.',
    answer2m:
      'Uniform post() is Composite’s gift; failure handling is the tax. Track leaf state, checkpoint, compensating reverse for posted siblings if business requires all-or-nothing at bulk level — often a saga, not a local txn.',
    followUps: ['Iterator + Composite together?', 'Flyweight currency in the same job?'],
    wrongAnswer: 'One @Transactional around the whole tree including external NEFT.',
  },
  {
    level: 'lead',
    topic: 'Behavioral',
    question: 'Would you use classic Visitor in Java 21 for account reports?',
    answer30s: 'Only if types are very stable and ops explode; else sealed types + pattern switch.',
    answer2m:
      'Visitor shines when Savings/Loan/Card rarely change but GST/TDS/audit grow monthly. If product types churn, Visitor taxes every addition. Sealed interfaces + switch can replace double dispatch with clearer exhaustiveness.',
    followUps: ['Show accept/visit skeleton', 'Month-end job packaging'],
    wrongAnswer: 'Always Visitor for any report.',
  },
  {
    level: 'scenario',
    topic: 'Meridian Bank',
    question: 'Priya pays rent — name 8 patterns you touch before money settles.',
    answer30s: 'Facade, Proxy, Builder, Factory, Strategy, Adapter, Chain, Command (then State/Observer…).',
    answer2m:
      'Pay button Facade; Proxy auth; Builder payload; Factory/Strategy rail; Adapter to NPCI; Chain KYC/AML/fraud; debit Command; State transitions; Observer notifies. The master story is the answer key.',
    followUps: ['Where does Decorator sit?', 'Singleton holiday calendar?'],
    wrongAnswer: 'List pattern names with no payment scene.',
  },
  {
    level: 'scenario',
    topic: 'Production',
    question: 'Singleton holiday calendar drifts between fraud and ledger pods — what broke?',
    answer30s: 'Process singleton is per JVM; cluster needs shared source of truth.',
    answer2m:
      'Each pod has its own Singleton. Load calendars from a versioned shared store (DB/config service) or pin versions. Classic Singleton never gave cluster-wide uniqueness.',
    followUps: ['UTR sequence across pods?', 'Spring bean vs enum singleton?'],
    wrongAnswer: 'Add synchronized to getInstance and it becomes cluster-safe.',
    trick: 'JVM singleton ≠ distributed singleton.',
  },
];

export const INTERVIEW_ALL: InterviewQ[] = RAW.map((r, i) => q(r, i));
export const BASIC = INTERVIEW_ALL.filter((x) => x.level === 'basic');
export const INTERMEDIATE = INTERVIEW_ALL.filter((x) => x.level === 'intermediate');
export const SENIOR = INTERVIEW_ALL.filter((x) => x.level === 'senior');
export const LEAD = INTERVIEW_ALL.filter((x) => x.level === 'lead');
export const SCENARIO = INTERVIEW_ALL.filter((x) => x.level === 'scenario');
'''
    )

    print(f"Wrote {len(patterns)} patterns to {OUT}")


if __name__ == "__main__":
    main()
