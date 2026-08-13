import type {VersionSection} from './types';

export const JAVA_17: VersionSection = {
  id: 'java-17',
  version: 'Java 17',
  year: '2021',
  lts: true,
  overview:
    'Java 17 is the enterprise modernization LTS: records, sealed classes, pattern matching for instanceof, text blocks, switch expressions (finalized earlier, ubiquitous by 17), and strong encapsulation of JDK internals by default. Many orgs treat 17 as the first “modern Java” production baseline.',
  whyMatters:
    'It is where domain modeling improves (records/sealed) and where reflective hacks finally fail loudly — forcing honest dependency hygiene before virtual threads arrive in 21.',
  majorFeatures: [
    {
      name: 'Records',
      status: 'FINAL',
      jep: 'JEP 395 (final in 16; production staple by 17)',
      problem: 'DTOs/value objects drowned in boilerplate and mutable JavaBean accidents.',
      before: 'Hand-written equals/hashCode/toString or Lombok @Data on entities.',
      solution: 'Nominal immutable carriers with canonical/compact constructors.',
      production: 'API payloads, domain events, money value objects — not JPA entities.',
      interview: 'Why are records a poor default for JPA entities?',
      code: `public record Payment(
    String transactionId,
    BigDecimal amount,
    String currency
) {
  public Payment {
    Objects.requireNonNull(transactionId);
    if (amount.signum() <= 0) throw new IllegalArgumentException("amount");
  }
}`,
    },
    {
      name: 'Sealed classes',
      status: 'FINAL',
      jep: 'JEP 409',
      problem: 'Open inheritance made domain variants impossible to exhaustively reason about.',
      before: 'Marker interfaces + default branches + runtime ClassCastException risk.',
      solution: 'sealed + permits; subtypes final / sealed / non-sealed.',
      production: 'Payment method hierarchies, booking states, protocol messages.',
      interview: 'How do sealed types improve API security and DDD modeling?',
      code: `sealed interface Payment permits CardPayment, BankTransfer, WalletPayment {}

record CardPayment(String panToken, String network) implements Payment {}
record BankTransfer(String iban) implements Payment {}
non-sealed class WalletPayment implements Payment {
  // intentionally open for wallet-provider plugins
}`,
    },
    {
      name: 'Pattern matching for instanceof',
      status: 'FINAL',
      jep: 'JEP 394',
      problem: 'Cast-after-instanceof noise and shadowing bugs.',
      before: 'if (p instanceof CardPayment) { CardPayment c = (CardPayment) p; ... }',
      solution: 'if (p instanceof CardPayment c) { ... use c ... }',
      production: 'Legacy polymorphic payment handlers during migration to sealed+switch.',
      interview: 'What are the flow scopes of a pattern variable?',
    },
    {
      name: 'Text blocks',
      status: 'FINAL',
      jep: 'JEP 378 (final in 15)',
      problem: 'Multi-line SQL/JSON/HTML escaped into unreadable strings.',
      before: '"SELECT ... \\n" + "FROM ..."',
      solution: '""" ... """ with incidental indentation stripping.',
      production: 'Native queries, HTML email templates, JSON fixtures in tests.',
      interview: 'How do you safely embed quotes and control trailing newlines?',
    },
    {
      name: 'Strong encapsulation of JDK internals',
      status: 'FINAL',
      jep: 'JEP 403',
      problem: 'Libraries poking sun.misc / internal packages broke across JDK updates.',
      before: '--illegal-access=permit and warnings on 9–16.',
      solution: 'Strong encapsulation by default; open modules only with explicit flags.',
      production: 'Forces upgrades of Mockito/ByteBuddy, ORMs, agents, and older APMs.',
      interview: 'How do you detect and eliminate illegal reflective access before go-live?',
    },
  ],
  language: [
    'Records, sealed classes, pattern matching for instanceof',
    'Switch expressions (final since 14) as everyday style',
    'Text blocks',
  ],
  api: [
    'Enhanced PRNGs (JEP 356)',
    'Context-specific deserialization filters (JEP 415)',
    'Foreign Function & Memory still incubating/previewing — not final in 17',
  ],
  jvm: [
    'Strongly encapsulated JDK internals',
    'Continued AArch64 / container awareness improvements across updates',
  ],
  gc: [
    'G1 remains the pragmatic default for many services',
    'ZGC production-ready lineage continues; Generational ZGC comes later (21)',
    'Shenandoah available in many builds',
  ],
  concurrency: [
    'Still platform threads; Project Loom previews exist in non-LTS but not final here',
    'Reactive + CF remain dominant high-concurrency tools',
  ],
  security: [
    'Deserialization filters context-specific — critical for untrusted payloads',
    'Sealed hierarchies reduce unexpected subtype injection in some designs',
  ],
  performance: [
    'Encapsulation fixes can change warm-up if agents break — validate',
    'Records can help escape analysis / clarity; do not expect magic speedups',
  ],
  deprecated: [
    'Security Manager deprecated for removal (trajectory finalized later)',
    'Applet API removed earlier; continue cleaning legacy desktop APIs',
  ],
  removed: [
    'Experimental AOT/JIT compilers from earlier experiments not a 17 story — focus on RMI/activation legacy cleanup in the broader 11→17 window',
    'Legacy APIs depending on illegal access without flags simply fail',
  ],
  productionUsage: [
    'Preferred LTS for Spring Boot 3 / Jakarta EE 9+ stacks',
    'Records for events; still careful with JPA',
  ],
  migrationImpact: [
    'Illegal reflective access becomes hard failures',
    'Spring Boot 2→3 often couples with javax→jakarta and Java 17',
    'Review JVM flags removed/ignored since 8/11',
  ],
  codePairs: [
    {
      title: 'Payment domain modeling',
      oldLabel: 'Open inheritance',
      newLabel: 'Java 17 sealed + record',
      old: `interface Payment {}
class CardPayment implements Payment { String pan; }
class BankTransfer implements Payment { String iban; }
// any jar can add EvilPayment implements Payment`,
      new: `sealed interface Payment permits CardPayment, BankTransfer {}
record CardPayment(String panToken) implements Payment {}
record BankTransfer(String iban) implements Payment {}`,
      whatChanged: 'Closed world of payment variants.',
      why: 'Exhaustive handling + clearer API surface for partners.',
      workload: 'Domain services and public APIs.',
      newBottleneck: 'non-sealed escape hatches — use deliberately for plugins only.',
    },
  ],
  interviewQuestions: [
    'Explain compact constructors vs canonical constructors on records.',
    'When do you choose sealed + final vs non-sealed for a payment SPI?',
    'How do deserialization filters change your Kafka payload security story?',
  ],
  architectQuestions: [
    'Justify Java 17 as a platform golden image versus staying on 11 for “stability”.',
    'How do you migrate a Lombok-heavy codebase toward records without a big-bang rewrite?',
  ],
  commonMistakes: [
    'Using records as JPA entities',
    'Leaving --add-opens as permanent debt',
    'Claiming pattern matching for switch is final in 17 (it is not — final in 21)',
  ],
};
