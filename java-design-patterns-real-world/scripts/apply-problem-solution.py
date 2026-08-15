#!/usr/bin/env python3
"""Apply PROBLEM/SOLUTION JavaDoc, run() preamble, and README updates."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/main/java/com/example/designpatterns"

PATTERNS = {
    "creational/singleton/ConfigManagerDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Fraud, gateway, and ledger services each load their own payment config file.\n"
            " * - Timeouts and thresholds drift between modules; duplicate parsing wastes memory.\n"
            " * - Under concurrency, two instances can disagree on fraud.threshold mid-settlement.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - ConfigManager exposes one JVM-wide instance via a lazy holder.\n"
            " * - All callers read the same immutable map; paymentTimeout() never forks settings.\n"
            " * - Enum singleton shows an alternate thread-safe single-instance style."
        ),
        "run_problem": (
            "Many payment services each load their own config, so timeouts and fraud thresholds "
            "diverge and duplicate parsing wastes memory."
        ),
        "run_solution": (
            "A single ConfigManager instance (holder-based singleton) shares one config map "
            "across the JVM so every caller reads identical settings."
        ),
        "readme": {
            "problem": (
                "Fraud scoring, gateway routing, and ledger posting each maintain a separate "
                "copy of `payment.timeout` and `fraud.threshold`. When ops updates a threshold in "
                "one service, others keep stale values until restart."
            ),
            "why_breaks": (
                "Settlement jobs read 30s timeouts while the API gateway still uses 60s. Duplicate "
                "file parsing on every deploy multiplies memory use. Two threads constructing "
                "ConfigManager at startup can briefly see different maps."
            ),
            "solution": (
                "Holder-based singleton (and enum alternative) guarantees one shared config source. "
                "Static accessors like `paymentTimeout()` route every module through the same "
                "instance so fraud, gateway, and ledger stay aligned."
            ),
        },
    },
    "creational/factory/PaymentGatewayFactoryDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Checkout and refund services hard-code `new StripeGateway()` or `new PaypalGateway()`.\n"
            " * - Adding Adyen or switching default provider forces edits across every caller.\n"
            " * - Provider-specific construction (API keys, region) leaks into business logic.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentGatewayFactory centralizes the switch on Provider enum.\n"
            " * - Callers depend on PaymentGateway interface; factory returns the right concrete type.\n"
            " * - New providers are added in one place without touching charge flows."
        ),
        "run_problem": (
            "Callers hard-code new StripeGateway() or PaypalGateway(); adding Adyen means "
            "editing every checkout and refund path."
        ),
        "run_solution": (
            "PaymentGatewayFactory.create(Provider) returns the right PaymentGateway implementation "
            "from one branch so callers never instantiate concrete gateways."
        ),
        "readme": {
            "problem": (
                "CheckoutService, RefundService, and SubscriptionBilling each contain "
                "`if (provider.equals(\"STRIPE\")) new StripeGateway()` branches. Product wants "
                "Adyen in Europe next sprint."
            ),
            "why_breaks": (
                "Every new PSP requires touching three services and their tests. Credentials and "
                "sandbox URLs get copy-pasted. A missed branch ships PayPal code to a Stripe-only "
                "merchant."
            ),
            "solution": (
                "PaymentGatewayFactory encapsulates provider selection behind `create(Provider)`. "
                "Business code charges through the PaymentGateway interface; only the factory "
                "knows which concrete gateway to construct."
            ),
        },
    },
    "creational/abstractfactory/RegionalBankingFactoryDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - A US merchant accidentally pairs SEPA rails with US routing account rules.\n"
            " * - Callers pick payment and account services independently; families get mixed.\n"
            " * - Region-specific compliance (KYC, IBAN) must always match the payment rail.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - IndiaBankingFactory, EuropeBankingFactory, and USBankingFactory each return a\n"
            " *   compatible PaymentService + AccountService pair.\n"
            " * - Clients depend on BankingFactory; they never mix US ACH with EU IBAN rules.\n"
            " * - One factory choice locks in the entire regional product family."
        ),
        "run_problem": (
            "Region needs a matching family (account + payment rail + compliance); mixing US ACH "
            "with EU IBAN rules creates illegal payment combinations."
        ),
        "run_solution": (
            "Regional BankingFactory returns a consistent PaymentService and AccountService pair "
            "so India, Europe, and US stacks never cross-contaminate."
        ),
        "readme": {
            "problem": (
                "Onboarding picks `UPI payment rail` from India config but loads `US routing "
                "account rules` because two separate factories were wired by mistake."
            ),
            "why_breaks": (
                "SEPA transfers post against accounts without IBAN validation. Compliance audits "
                "flag mismatched KYC packs. Each new region means combinatorial if-else across "
                "account, statement, and payment modules."
            ),
            "solution": (
                "IndiaBankingFactory, EuropeBankingFactory, and USBankingFactory each vend a "
                "complete family. Selecting one factory guarantees payment rail and account rules "
                "stay in the same regulatory region."
            ),
        },
    },
    "creational/builder/PaymentTransactionBuilderDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - PaymentTransaction has eight fields; telescoping constructors multiply quickly.\n"
            " * - Optional metadata, retry policy, and callback URL produce invalid partial objects.\n"
            " * - Callers forget fraudCheck or pass amount without currency before sending to gateway.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Fluent Builder sets fields step-by-step with sensible defaults (retryPolicy, fraudCheck).\n"
            " * - build() assembles one immutable PaymentTransaction with a complete, consistent snapshot.\n"
            " * - Optional fields stay optional without constructor overload explosion."
        ),
        "run_problem": (
            "Telescoping constructors and half-filled PaymentTransaction objects let optional "
            "fields like retryPolicy or fraudCheck slip through to the gateway."
        ),
        "run_solution": (
            "Fluent Builder sets required and optional fields step-by-step; build() returns one "
            "immutable, fully specified PaymentTransaction."
        ),
        "readme": {
            "problem": (
                "API clients must construct PaymentTransaction with transactionId, customerId, "
                "amount, currency, metadata, retryPolicy, fraudCheck, and callbackUrl. Teams "
                "added five constructor overloads and still ship transactions with null currency."
            ),
            "why_breaks": (
                "A refund queued without fraudCheck bypasses screening. Metadata maps shared by "
                "reference mutate after build. Optional callback URLs are forgotten in three of "
                "twelve integration paths."
            ),
            "solution": (
                "PaymentTransactionBuilderDemo.Builder offers fluent setters with defaults "
                "(retryPolicy=NONE, fraudCheck=true). build() copies metadata and returns an "
                "immutable record ready for the gateway."
            ),
        },
    },
    "creational/prototype/ReportConfigurationPrototypeDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Finance ops need dozens of daily-settlement reports differing only by country filter.\n"
            " * - Rebuilding each ReportConfiguration from scratch repeats expensive validation.\n"
            " * - Shallow copies share mutable filter maps and leak edits across tenants.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - A validated base template is deepCopy()'d for each regional variant.\n"
            " * - Only the clone's country filter changes; the prototype stays untouched.\n"
            " * - Cloning is cheaper and safer than reconstructing filters from strings each time."
        ),
        "run_problem": (
            "Cloning expensive, nearly identical report configs is slow; rebuilding from scratch "
            "each run repeats validation and risks copy-paste errors."
        ),
        "run_solution": (
            "deepCopy() clones a validated ReportConfiguration template so each regional variant "
            "tweaks only what differs without mutating the shared prototype."
        ),
        "readme": {
            "problem": (
                "Treasury generates daily-settlement CSV reports for 40 countries. Each run rebuilds "
                "filters, format, and column maps from YAML even though only the country code "
                "changes."
            ),
            "why_breaks": (
                "Startup latency grows linearly with region count. A typo in one YAML file ships "
                "wrong filters. Shallow clones let one tenant's edit corrupt another's report "
                "definition."
            ),
            "solution": (
                "ReportConfigurationPrototypeDemo keeps a validated base template. deepCopy() "
                "produces an independent clone; mutating the clone's country filter leaves the "
                "prototype intact."
            ),
        },
    },
    "structural/adapter/LegacyPaymentAdapterDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - New checkout code expects pay(customerId, amountInDollars) on ModernPaymentService.\n"
            " * - The bank's LegacyPaymentApi only exposes submitLegacy(account, cents).\n"
            " * - Every caller would duplicate dollar-to-cent conversion and account mapping.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentAdapter implements ModernPaymentService and wraps LegacyPaymentApi.\n"
            " * - Translation (dollars × 100, customerId → account) lives inside the adapter.\n"
            " * - Clients stay on the modern interface without rewriting the legacy SDK."
        ),
        "run_problem": (
            "New payment code expects a modern pay(customerId, amount) API but the legacy bank SDK "
            "only accepts submitLegacy(account, cents) with incompatible parameters."
        ),
        "run_solution": (
            "PaymentAdapter implements ModernPaymentService, wraps LegacyPaymentApi, and translates "
            "dollars to cents so clients never touch the legacy shape."
        ),
        "readme": {
            "problem": (
                "The mobile app calls `pay(customerId, 10)` but the only available integration is "
                "a 15-year-old bank SDK with `submitLegacy(account, cents)`."
            ),
            "why_breaks": (
                "Every new feature reimplements cent conversion and account mapping. A missed "
                "multiply-by-100 undercharges merchants. Replacing the SDK is a multi-year project."
            ),
            "solution": (
                "PaymentAdapter implements ModernPaymentService, delegates to LegacyPaymentApi, "
                "and centralizes translation. Checkout, refunds, and webhooks all speak the modern "
                "interface."
            ),
        },
    },
    "structural/bridge/NotificationBridgeDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Payment alerts need Email and SMS crossed with Twilio, SNS, and SendGrid providers.\n"
            " * - Subclass explosion: EmailTwilio, SmsTwilio, EmailSns, SmsSns, …\n"
            " * - Adding a push channel duplicates every provider combination again.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Notification abstraction (EmailNotification, SmsNotification) composes a Provider.\n"
            " * - TwilioProvider and SnsProvider vary independently from notification type.\n"
            " * - New channel or provider means one class, not N×M subclasses."
        ),
        "run_problem": (
            "Notification type times delivery channel explodes into EmailTwilio, SmsSns, and "
            "dozens of subclasses whenever product adds a channel or vendor."
        ),
        "run_solution": (
            "Notification abstractions compose a Provider implementor so email vs SMS and Twilio "
            "vs SNS vary independently without subclass explosion."
        ),
        "readme": {
            "problem": (
                "Payment receipt alerts must go out as email or SMS through Twilio, SNS, or "
                "SendGrid. Product asks for push notifications next quarter."
            ),
            "why_breaks": (
                "Six combinations today become twelve with push. Each subclass duplicates "
                "formatting logic. Switching SMS vendor means editing every SMS subclass."
            ),
            "solution": (
                "EmailNotification and SmsNotification (abstraction) hold a Provider "
                "(TwilioProvider, SnsProvider). Compose any notification type with any transport "
                "without multiplying subclasses."
            ),
        },
    },
    "structural/composite/OrderCompositeDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Checkout must price individual products and promotional bundles differently.\n"
            " * - Cart total logic branches on \"is this a bundle?\" at every level of nesting.\n"
            " * - Adding nested bundles (gift set inside mega-bundle) duplicates summation code.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Product (leaf) and Bundle (composite) both implement OrderComponent.total().\n"
            " * - Bundle recursively sums children; callers call total() uniformly.\n"
            " * - Nested bundles work without special-case pricing loops."
        ),
        "run_problem": (
            "Checkout treats single products and bundles with separate total() logic, so nested "
            "bundles and mixed carts need special-case summation code."
        ),
        "run_solution": (
            "Product and Bundle both implement OrderComponent; Bundle.total() recursively sums "
            "children so any cart shape uses one uniform call."
        ),
        "readme": {
            "problem": (
                "A cart holds a book ($20), a bag ($80), and a gift bundle that itself contains "
                "two accessories. Pricing code has separate paths for line items vs bundles."
            ),
            "why_breaks": (
                "Nested bundles double-count or skip items. Promotions applied at bundle level "
                "miss leaf products. Every new bundle type forks the total() method."
            ),
            "solution": (
                "OrderCompositeDemo treats Product and Bundle as OrderComponent. Bundle.total() "
                "delegates to children recursively, so checkout calls total() once whether the "
                "cart is flat or deeply nested."
            ),
        },
    },
    "structural/decorator/PaymentDecoratorDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Production needs logging, fraud check, metrics, and retry on every charge.\n"
            " * - Subclassing BasicPayment for each combination explodes (LoggingFraudRetry…).\n"
            " * - Editing core payment logic risks breaking observability on every release.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Decorators implement PaymentProcessor and wrap a delegate.\n"
            " * - LoggingDecorator, MetricsDecorator, RetryDecorator stack in any order at runtime.\n"
            " * - Core BasicPayment stays unchanged; cross-cutting concerns compose by nesting."
        ),
        "run_problem": (
            "Adding logging, metrics, fraud check, and retry to every charge via subclasses would "
            "explode combinations and couple observability to core payment code."
        ),
        "run_solution": (
            "Single-purpose decorators wrap PaymentProcessor and nest at runtime so cross-cutting "
            "concerns stack without editing BasicPayment."
        ),
        "readme": {
            "problem": (
                "Every card charge needs audit logging, fraud screening, success metrics, and "
                "retry on transient gateway errors. Teams subclass BasicPayment for each mix."
            ),
            "why_breaks": (
                "LoggingFraudRetryPayment duplicates charge logic. Reordering retry before fraud "
                "requires a new subclass. Unit tests must cover 2^4 decorator combinations."
            ),
            "solution": (
                "PaymentDecoratorDemo wraps BasicPayment with LoggingDecorator, MetricsDecorator, "
                "and RetryDecorator. Nest decorators at runtime; core charge logic never changes."
            ),
        },
    },
    "structural/facade/PaymentFacadeDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Mobile API must call fraud, account, payment, notification, and audit in order.\n"
            " * - Controllers duplicate orchestration and forget a step under pressure.\n"
            " * - Each client reimplements rejection handling when fraud blocks a charge.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentFacade.processDetailed runs the full pipeline behind one method.\n"
            " * - Subsystems stay separate; facade coordinates and returns PaymentOutcome.\n"
            " * - Callers pass accountId and amount — no wiring of five services."
        ),
        "run_problem": (
            "Callers must wire fraud check, account balance, charge, customer notification, and "
            "audit themselves, duplicating orchestration and missing steps."
        ),
        "run_solution": (
            "PaymentFacade.processDetailed orchestrates all subsystems behind one call and returns "
            "a single PaymentOutcome with status, reference, and steps."
        ),
        "readme": {
            "problem": (
                "The mobile checkout endpoint must run fraud screening, balance check, charge, "
                "customer notification, and audit logging in sequence before returning success."
            ),
            "why_breaks": (
                "A new engineer ships a path that charges before fraud review. Web and mobile "
                "controllers diverge on rejection messages. Integration tests mock five services "
                "per endpoint."
            ),
            "solution": (
                "PaymentFacade exposes processDetailed(accountId, amount). Internally it "
                "coordinates FraudService, AccountService, PaymentService, NotificationService, "
                "and AuditService, returning one PaymentOutcome."
            ),
        },
    },
    "structural/flyweight/CurrencyFlyweightDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Settlement creates millions of MoneyLine objects each storing USD symbol and code.\n"
            " * - Identical currency metadata is duplicated in heap for every transaction row.\n"
            " * - GC pressure grows with volume even though only ~150 ISO codes exist.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - CurrencyFactory caches CurrencyMetadata flyweights keyed by code.\n"
            " * - Millions of amounts share one USD instance; extrinsic amount stays per line.\n"
            " * - Cache size stays bounded by distinct currencies, not transaction count."
        ),
        "run_problem": (
            "Millions of money line items each duplicate currency code and symbol metadata, "
            "inflating heap use even though only ~150 ISO currencies exist."
        ),
        "run_solution": (
            "CurrencyFactory caches shared CurrencyMetadata flyweights by code so every amount "
            "references one intrinsic instance per currency."
        ),
        "readme": {
            "problem": (
                "End-of-day settlement materializes 5M ledger rows, each embedding `USD` and `$` "
                "strings even though the currency never changes within a batch."
            ),
            "why_breaks": (
                "Heap usage scales with row count, not currency diversity. Young-gen collections "
                "spike during batch import. Identical metadata strings fragment memory."
            ),
            "solution": (
                "CurrencyFlyweightDemo's factory returns shared CurrencyMetadata per ISO code. "
                "Line items keep only extrinsic amount; intrinsic symbol and code live once in "
                "the cache."
            ),
        },
    },
    "structural/proxy/PaymentServiceProxyDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Status lookups hit the core payment DB on every dashboard refresh.\n"
            " * - Unauthorized callers could reach RealPaymentService without a central gate.\n"
            " * - Caching and auth would be copy-pasted into every client of fetchStatus.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentServiceProxy implements PaymentService like the real subject.\n"
            " * - Token check runs before delegate; cache avoids repeat fetches for same paymentId.\n"
            " * - Clients use the proxy transparently — same interface, controlled access."
        ),
        "run_problem": (
            "Every status lookup hits the real payment service with no auth gate or cache, "
            "overloading the DB and exposing fetchStatus to unauthorized callers."
        ),
        "run_solution": (
            "PaymentServiceProxy checks tokens and caches results before delegating to "
            "RealPaymentService, controlling access without changing the client interface."
        ),
        "readme": {
            "problem": (
                "Support dashboards poll `fetchStatus(paymentId)` hundreds of times per minute. "
                "Each call reaches the core ledger service with no auth check and no caching."
            ),
            "why_breaks": (
                "DB connection pools saturate during incidents. A leaked internal URL lets "
                "unauthenticated scripts scrape settlement status. Every client reimplements "
                "token validation differently."
            ),
            "solution": (
                "PaymentServiceProxy implements PaymentService, rejects bad tokens, and caches "
                "SETTLED responses per paymentId before delegating to RealPaymentService."
            ),
        },
    },
    "behavioral/chainofresponsibility/PaymentValidationChainDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - validatePayment() grows into a 200-line method: auth, amount, fraud, account.\n"
            " * - Reordering checks or adding KYC means editing the monolith and retesting everything.\n"
            " * - Early returns are buried in nested if-else blocks.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Each Validator handles one concern and links to the next via linkWith.\n"
            " * - validate() walks the chain; first failure short-circuits with a clear code.\n"
            " * - New validators plug in without touching existing handler code."
        ),
        "run_problem": (
            "One mega validatePayment() method chains auth, amount, fraud, and account checks in "
            "nested if-else, making reordering or adding validators risky."
        ),
        "run_solution": (
            "Linked Validator handlers each check one concern; validate() walks the chain and "
            "short-circuits on the first failure."
        ),
        "readme": {
            "problem": (
                "Payment submission runs authentication, amount limits, fraud flags, and account "
                "status inside a single service method with deeply nested conditionals."
            ),
            "why_breaks": (
                "Compliance asks to run fraud before amount check; the change risks regressions "
                "across all branches. Unit tests mock the entire method instead of one rule. "
                "Duplicate validation logic appears in batch and API paths."
            ),
            "solution": (
                "PaymentValidationChainDemo links AuthenticationValidator → AmountValidator → "
                "FraudValidator → AccountValidator. Each handler passes or stops; new rules "
                "insert as new links without editing peers."
            ),
        },
    },
    "behavioral/command/PaymentCommandDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Create, cancel, refund, and retry are direct method calls with no audit trail.\n"
            " * - Batch jobs cannot queue operations for later execution.\n"
            " * - Undo and compliance replay need structured records of what ran.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Each action is a Command object (CreatePaymentCommand, RefundPaymentCommand).\n"
            " * - CommandInvoker queues commands and calls execute without knowing receiver details.\n"
            " * - Operations become first-class objects suitable for logging, retry, and undo."
        ),
        "run_problem": (
            "Payment create, cancel, refund, and retry are bare method calls that cannot be "
            "queued, audited, or replayed as structured operations."
        ),
        "run_solution": (
            "Command objects encapsulate each action; CommandInvoker queues and executes them "
            "without coupling to PaymentReceiver internals."
        ),
        "readme": {
            "problem": (
                "Ops needs to replay last night's refund batch and audit which operator triggered "
                "each cancel. Today those are direct calls on PaymentReceiver with no history."
            ),
            "why_breaks": (
                "Failed mid-batch runs cannot resume. Compliance cannot prove who initiated a "
                "refund. Adding retry means new imperative code in the job runner, not a reusable "
                "operation object."
            ),
            "solution": (
                "CreatePaymentCommand, RefundPaymentCommand, and peers wrap PaymentReceiver "
                "calls. CommandInvoker queues and executes commands, enabling audit logs, deferred "
                "execution, and future undo support."
            ),
        },
    },
    "behavioral/interpreter/TransactionRuleInterpreterDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Fee waiver rules combine amount thresholds and country checks in hard-coded Java.\n"
            " * - Product changes a rule string; engineering redeploys for every tweak.\n"
            " * - Nested AND/OR conditions become unreadable boolean spaghetti.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Rules parse into an Expression AST (AmountGreaterThan, CountryEquals, AndExpression).\n"
            " * - interpret(transaction) evaluates the tree against live transaction data.\n"
            " * - New rule shapes compose existing expressions without new if-else branches."
        ),
        "run_problem": (
            "Fee and compliance rules like amount > 1000 AND country = IN are hard-coded in Java "
            "branches, requiring redeploys for every rule tweak."
        ),
        "run_solution": (
            "parse() builds an Expression AST; interpret() evaluates rules against transactions so "
            "logic composes without nested if-else."
        ),
        "readme": {
            "problem": (
                "Risk team defines waiver rules as `amount > 1000 AND country = \"IN\"` but "
                "engineering encodes each combination as nested if statements in Java."
            ),
            "why_breaks": (
                "A rule change needs a full release. OR conditions duplicate branches. Business "
                "analysts cannot validate logic without reading production code."
            ),
            "solution": (
                "TransactionRuleInterpreterDemo parses rule strings into AmountGreaterThan, "
                "CountryEquals, and AndExpression nodes. interpret() walks the AST against each "
                "Transaction at runtime."
            ),
        },
    },
    "behavioral/iterator/TransactionIteratorDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Statement export reaches into TransactionRepository's internal ArrayList.\n"
            " * - Switching storage to paged DB cursors breaks every foreach over .items.\n"
            " * - Clients know too much about how history is stored.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - TransactionRepository implements Iterable and exposes iterator().\n"
            " * - Enhanced-for traverses without leaking the backing list.\n"
            " * - Storage can change to lazy pages while the traversal API stays stable."
        ),
        "run_problem": (
            "Clients dig into TransactionRepository's internal list to walk history, coupling "
            "statement export to a specific storage shape."
        ),
        "run_solution": (
            "Iterable TransactionRepository exposes iterator() so clients traverse with enhanced-for "
            "without knowing whether data lives in a list, pages, or a cursor."
        ),
        "readme": {
            "problem": (
                "Monthly statement generation loops over `repository.items` directly, assuming an "
                "in-memory ArrayList of all transactions."
            ),
            "why_breaks": (
                "Moving to paginated DB reads breaks every caller. External modules mutate the "
                "exposed list. Tests cannot swap in a fake repository without matching internal "
                "structure."
            ),
            "solution": (
                "TransactionIteratorDemo hides storage behind Iterable<Transaction>. Callers use "
                "enhanced-for; the repository can later stream pages without API changes."
            ),
        },
    },
    "behavioral/mediator/OrderProcessingMediatorDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - PaymentService calls InventoryService which calls NotificationService directly.\n"
            " * - Circular imports and hidden call chains make checkout hard to change.\n"
            " * - Adding shipping means editing payment and inventory classes.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - OrderProcessingMediator is the only peer colleagues talk through.\n"
            " * - placeOrder orchestrates authorize → reserve → notify in one place.\n"
            " * - Colleagues no longer reference each other; coupling moves to the mediator."
        ),
        "run_problem": (
            "Payment, inventory, and notification services call each other directly, creating "
            "spaghetti dependencies and circular imports."
        ),
        "run_solution": (
            "OrderProcessingMediator coordinates colleagues; placeOrder runs authorize, reserve, "
            "and notify so peers never reference each other."
        ),
        "readme": {
            "problem": (
                "Checkout triggers PaymentService.authorize, which calls InventoryService.reserve, "
                "which calls NotificationService.notifyCustomer — each service imports the others."
            ),
            "why_breaks": (
                "Adding shipping requires edits in three services. Integration tests need the "
                "entire mesh running. A failure in notification rolls back logic scattered "
                "across classes."
            ),
            "solution": (
                "OrderProcessingMediatorDemo's placeOrder sequences payment, inventory, and "
                "notification. Colleagues expose narrow methods; only the mediator wires the "
                "workflow."
            ),
        },
    },
    "behavioral/memento/PaymentConfigurationMementoDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Ops edits gateway from STRIPE to ADYEN and cannot undo a bad change.\n"
            " * - Exposing PaymentConfiguration fields for rollback breaks encapsulation.\n"
            " * - Support needs snapshot/restore without serializing the whole service.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - save() captures an opaque Snapshot memento of gateway and timeout.\n"
            " * - restore(snapshot) puts configuration back without public field access.\n"
            " * - Caretaker stores mementos; originator controls what is inside the snapshot."
        ),
        "run_problem": (
            "Ops cannot undo a bad gateway or timeout edit without exposing PaymentConfiguration "
            "internals or redeploying from backup."
        ),
        "run_solution": (
            "save() captures an opaque Snapshot; restore() rolls back gateway and timeout without "
            "leaking private fields to the caretaker."
        ),
        "readme": {
            "problem": (
                "An on-call engineer switches payment gateway from STRIPE to ADYEN during an "
                "incident and needs to roll back quickly if error rates spike."
            ),
            "why_breaks": (
                "Making fields public for rollback invites accidental edits elsewhere. Database "
                "restore is too slow for a 2 a.m. toggle. There is no lightweight undo stack."
            ),
            "solution": (
                "PaymentConfigurationMementoDemo.save() records gateway and timeout in an opaque "
                "Snapshot. restore() reapplies the memento; support keeps a stack of snapshots "
                "without reading private state."
            ),
        },
    },
    "behavioral/observer/PaymentObserverDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - PaymentService hard-codes calls to email, audit, and analytics after every charge.\n"
            " * - Adding a loyalty listener means editing and redeploying the publisher.\n"
            " * - Listeners are tightly coupled; one slow subscriber blocks others.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentEventBus publish fans out PaymentCompletedEvent to registered observers.\n"
            " * - Audit and analytics subscribe independently without publisher changes.\n"
            " * - New listeners register at runtime; publisher only knows the Observer interface."
        ),
        "run_problem": (
            "PaymentService hard-codes email, audit, and analytics calls after every charge, so "
            "adding a listener requires editing the publisher."
        ),
        "run_solution": (
            "PaymentEventBus publishes PaymentCompletedEvent to registered Observer instances so "
            "new listeners attach without changing the payment core."
        ),
        "readme": {
            "problem": (
                "After capture, PaymentService directly invokes email receipt, audit log, and "
                "analytics pixel code inline."
            ),
            "why_breaks": (
                "Marketing wants a loyalty hook next sprint — that means a core payment deploy. "
                "A failing analytics call can block receipt email. Tests must stub every "
                "downstream integration inside PaymentService."
            ),
            "solution": (
                "PaymentObserverDemo registers CollectingObserver instances on PaymentEventBus. "
                "publish() notifies audit and analytics independently; new subscribers register "
                "without touching the publisher."
            ),
        },
    },
    "behavioral/state/PaymentStateDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Payment status is a string flag; capture() runs before authorize() in bugs.\n"
            " * - Giant switch on status spreads illegal-transition checks everywhere.\n"
            " * - FAILED and COMPLETED paths interleave in one class.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Each lifecycle phase is a PaymentState object (Created, Authorized, Captured…).\n"
            " * - Illegal operations throw from the current state; legal ones return the next state.\n"
            " * - Payment context delegates transitions; timeline records every phase change."
        ),
        "run_problem": (
            "String status flags let capture() run before authorize(); illegal lifecycle moves "
            "hide inside giant switch statements."
        ),
        "run_solution": (
            "Explicit PaymentState objects enforce legal transitions (authorize → capture → settle "
            "→ complete) and reject invalid operations at the current state."
        ),
        "readme": {
            "problem": (
                "Payments use a `status` string (`CREATED`, `AUTHORIZED`, …). A bug lets support "
                "call capture on a payment that was never authorized."
            ),
            "why_breaks": (
                "switch(status) blocks appear in five services and drift apart. FAILED payments "
                "sometimes reach COMPLETED via a missed case. Refunds on SETTLED items need "
                "duplicate guards everywhere."
            ),
            "solution": (
                "PaymentStateDemo models each phase as a class. CreatedState.authorize() returns "
                "AuthorizedState; capture() before authorize throws. Payment delegates all moves to "
                "the active state object."
            ),
        },
    },
    "behavioral/strategy/PaymentStrategyDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - PaymentService.pay() is a switch on UPI, CARD, PAYPAL, BANK_TRANSFER.\n"
            " * - Adding UPI means editing the same method and all its tests.\n"
            " * - Recurring eligibility rules mix with rail-specific charge logic.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - Each rail is a PaymentStrategy (UpiPaymentStrategy, CardPaymentStrategy, …).\n"
            " * - PaymentMethodRouter resolves strategy by enum; PaymentService delegates pay().\n"
            " * - New rails add a class and registry entry — no switch growth in the service."
        ),
        "run_problem": (
            "PaymentService.pay() is a growing switch on UPI, CARD, PayPal, and bank transfer, "
            "mixing rail-specific charge logic with recurring eligibility rules."
        ),
        "run_solution": (
            "PaymentStrategy implementations swap charge algorithms; PaymentMethodRouter resolves "
            "the right strategy so PaymentService never branches on payment type."
        ),
        "readme": {
            "problem": (
                "One `pay(String type, int amount)` method switches on UPI, CARD, PAYPAL, and "
                "BANK_TRANSFER with duplicated validation and provider-specific charge code."
            ),
            "why_breaks": (
                "Adding BNPL means editing the monolith method and twenty integration tests. "
                "Recurring eligibility for cards is tangled with UPI error handling. Copy-paste "
                "rails diverge on idempotency keys."
            ),
            "solution": (
                "UpiPaymentStrategy, CardPaymentStrategy, and peers implement PaymentStrategy. "
                "PaymentMethodRouter maps PaymentMethod to strategy; PaymentService.process() "
                "delegates without a type switch."
            ),
        },
    },
    "behavioral/templatemethod/PaymentProcessingTemplateDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Card and UPI flows duplicate validate → authenticate → process → audit → notify.\n"
            " * - A team reordering steps in one rail forgets the same fix in the other.\n"
            " * - Only the middle \"process\" step truly differs between payment types.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentProcessor.execute() is a final template fixing step order.\n"
            " * - CardProcessor and UpiProcessor override only the process() hook.\n"
            " * - Shared steps stay in the base class; subclasses cannot skip audit or notify."
        ),
        "run_problem": (
            "Card and UPI payment flows copy the same validate-authenticate-audit-notify pipeline, "
            "risking drift when only the process step should differ."
        ),
        "run_solution": (
            "PaymentProcessor.execute() defines a final template; CardProcessor and UpiProcessor "
            "override only process() while shared steps stay fixed in order."
        ),
        "readme": {
            "problem": (
                "Card checkout and UPI checkout both run validate, authenticate, process, audit, "
                "and notify — but two teams maintain nearly identical methods."
            ),
            "why_breaks": (
                "Card flow adds 3-D Secure in authenticate; UPI misses it for weeks. Someone "
                "reorders notify before audit in one path only. Code review cannot see skeleton "
                "violations easily."
            ),
            "solution": (
                "PaymentProcessingTemplateDemo's abstract PaymentProcessor.execute() locks step "
                "order. CardProcessor and UpiProcessor override only process(); validate, audit, "
                "and notify stay centralized."
            ),
        },
    },
    "behavioral/visitor/AccountVisitorDemo.java": {
        "javadoc_problem": (
            " * <p>PROBLEM (without this pattern)\n"
            " * - Interest, tax, and fee calculations need different math per account type.\n"
            " * - Adding \"annual fee\" means editing SavingsAccount, CurrentAccount, LoanAccount.\n"
            " * - Account classes swell with unrelated reporting methods.\n"
            "\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - InterestCalculationVisitor implements type-specific visit methods externally.\n"
            " * - Each account accept(visitor) double-dispatches to the right visit overload.\n"
            " * - New operations add a visitor class without touching account definitions."
        ),
        "run_problem": (
            "New operations like interest calculation force edits to SavingsAccount, "
            "CurrentAccount, and LoanAccount, bloating each type with reporting methods."
        ),
        "run_solution": (
            "InterestCalculationVisitor adds operation logic externally; accept(visitor) "
            "double-dispatches to the correct visit method per account type."
        ),
        "readme": {
            "problem": (
                "Finance needs interest accrual today and regulatory capital reporting next "
                "quarter across savings, current, and loan accounts."
            ),
            "why_breaks": (
                "Each new report adds methods to every account class. LoanAccount grows unrelated "
                "to savings features. Merge conflicts spike whenever tax rules change."
            ),
            "solution": (
                "AccountVisitorDemo keeps accounts stable. InterestCalculationVisitor implements "
                "visit per type; account.accept(visitor) routes via double dispatch so new "
                "operations ship as new visitors."
            ),
        },
    },
}

EXTRA = {
    "realworld/kafka/KafkaEventFlowDemo.java": {
        "class_javadoc": (
            "/**\n"
            " * In-memory stand-in for Kafka payment events.\n"
            " *\n"
            " * <p>PROBLEM (without this pattern)\n"
            " * - PaymentService calls email, audit, and search indexing inline after capture.\n"
            " * - A slow subscriber blocks settlement; adding a listener edits the payment core.\n"
            " *\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - InMemoryEventPublisher publishes PaymentCreatedEvent once.\n"
            " * - Consumers register independently and react in parallel (Observer-like decoupling).\n"
            " * - Producer stays unaware of concrete downstream integrations.\n"
            " */"
        ),
        "run_problem": (
            "After capture, payment code directly calls email, audit, and search indexing, "
            "coupling settlement to every side effect."
        ),
        "run_solution": (
            "Publish PaymentCreatedEvent once; registered consumers react independently without "
            "the producer knowing concrete listeners."
        ),
    },
    "realworld/payment/PaymentProcessingSystem.java": {
        "class_javadoc": (
            "/**\n"
            " * Combined payment orchestration using multiple GoF patterns behind one facade.\n"
            " *\n"
            " * <p>PROBLEM (without this pattern)\n"
            " * - Real checkout needs validation, strategy, gateway factory, decorators, state, and observers.\n"
            " * - Stuffing all of that into one PaymentService creates an unmaintainable god class.\n"
            " *\n"
            " * <p>HOW THIS PATTERN SOLVES IT\n"
            " * - PaymentFacade composes chain, strategy, factory, decorators, state machine, and observers.\n"
            " * - Each pattern owns one concern; callers invoke a single process() entry point.\n"
            " */"
        ),
        "run_problem": (
            "Production payments need validation chains, strategies, gateways, decorators, state "
            "transitions, and observers — but one god class cannot maintain all of that safely."
        ),
        "run_solution": (
            "PaymentFacade composes focused pattern building blocks behind one process() call so "
            "each concern stays testable and callers see a simple API."
        ),
    },
}


def insert_javadoc(content: str, javadoc_block: str) -> str:
    marker = " *\n * <p>WHEN TO IMPLEMENT"
    if "PROBLEM (without this pattern)" in content:
        return content
    if marker not in content:
        raise ValueError("WHEN TO IMPLEMENT marker not found")
    return content.replace(marker, javadoc_block + "\n *\n * <p>WHEN TO IMPLEMENT", 1)


def insert_run_preamble(content: str, problem: str, solution: str) -> str:
    if 'System.out.println("PROBLEM:' in content:
        return content
    match = re.search(
        r'(System\.out\.println\("=== [^"]+ ==="\);\n)',
        content,
    )
    if not match:
        raise ValueError("run() header not found")
    insert = (
        match.group(1)
        + f'    System.out.println("PROBLEM: {problem}");\n'
        + f'    System.out.println("SOLUTION: {solution}");\n'
    )
    return content.replace(match.group(1), insert, 1)


def update_readme(path: Path, sections: dict) -> None:
    text = path.read_text()
    replacements = [
        (
            r"## Problem\n\n.*?\n\n## Naive Implementation",
            f"## Problem\n\n{sections['problem']}\n\n## Naive Implementation",
        ),
        (
            r"## Why It Breaks\n\n.*?\n\n## Pattern Solution",
            f"## Why It Breaks\n\n{sections['why_breaks']}\n\n## Pattern Solution",
        ),
        (
            r"## Pattern Solution\n\n.*?\n\n## Code Flow",
            f"## Pattern Solution\n\n{sections['solution']}\n\n## Code Flow",
        ),
    ]
    for pattern, repl in replacements:
        text, n = re.subn(pattern, repl, text, count=1, flags=re.DOTALL)
        if n != 1:
            raise ValueError(f"README section not updated in {path}")
    path.write_text(text)


def add_class_javadoc(content: str, javadoc: str) -> str:
    if "PROBLEM (without this pattern)" in content:
        return content
    return re.sub(
        r"^(package [^;]+;\n\n)(public )",
        r"\1" + javadoc + "\n\n\2",
        content,
        count=1,
        flags=re.MULTILINE,
    )


def main() -> None:
    for rel, data in PATTERNS.items():
        java_path = SRC / rel
        content = java_path.read_text()
        content = insert_javadoc(content, data["javadoc_problem"])
        content = insert_run_preamble(content, data["run_problem"], data["run_solution"])
        java_path.write_text(content)

        readme_path = java_path.parent / "README.md"
        update_readme(readme_path, data["readme"])
        print(f"Updated {rel}")

    for rel, data in EXTRA.items():
        java_path = SRC / rel
        content = java_path.read_text()
        content = add_class_javadoc(content, data["class_javadoc"])
        content = insert_run_preamble(content, data["run_problem"], data["run_solution"])
        java_path.write_text(content)
        print(f"Updated {rel}")


if __name__ == "__main__":
    main()
