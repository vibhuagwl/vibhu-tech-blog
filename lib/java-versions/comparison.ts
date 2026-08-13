/** Capability matrix — Java 25 cells only for verified finalized platform capabilities. */
export const CAPABILITY_MATRIX: {
  capability: string;
  java8: boolean;
  java11: boolean;
  java17: boolean;
  java21: boolean;
  java25: boolean;
  note?: string;
}[] = [
  {capability: 'Lambda', java8: true, java11: true, java17: true, java21: true, java25: true},
  {capability: 'Stream API', java8: true, java11: true, java17: true, java21: true, java25: true},
  {capability: 'Optional', java8: true, java11: true, java17: true, java21: true, java25: true},
  {capability: 'CompletableFuture', java8: true, java11: true, java17: true, java21: true, java25: true},
  {capability: 'var (local)', java8: false, java11: true, java17: true, java21: true, java25: true},
  {capability: 'HTTP Client', java8: false, java11: true, java17: true, java21: true, java25: true},
  {capability: 'Records', java8: false, java11: false, java17: true, java21: true, java25: true},
  {capability: 'Sealed Classes', java8: false, java11: false, java17: true, java21: true, java25: true},
  {capability: 'Pattern Matching (instanceof)', java8: false, java11: false, java17: true, java21: true, java25: true},
  {capability: 'Text Blocks', java8: false, java11: false, java17: true, java21: true, java25: true},
  {capability: 'Virtual Threads', java8: false, java11: false, java17: false, java21: true, java25: true},
  {capability: 'Record Patterns', java8: false, java11: false, java17: false, java21: true, java25: true},
  {capability: 'Pattern Matching for switch', java8: false, java11: false, java17: false, java21: true, java25: true},
  {capability: 'Sequenced Collections', java8: false, java11: false, java17: false, java21: true, java25: true},
  {
    capability: 'Scoped Values',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: true,
    note: 'Preview in 21–24; final in JDK 25 (JEP 506)',
  },
  {
    capability: 'Structured Concurrency',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: false,
    note: 'Still PREVIEW in JDK 25 (JEP 505, 5th preview) — not production-final',
  },
  {
    capability: 'Module Import Declarations',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: true,
    note: 'JDK 25 final (JEP 511)',
  },
  {
    capability: 'Compact Object Headers',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: true,
    note: 'JDK 25 final (JEP 519)',
  },
  {
    capability: 'Key Derivation Function API',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: true,
    note: 'JDK 25 final (JEP 510)',
  },
  {
    capability: 'Generational Shenandoah',
    java8: false,
    java11: false,
    java17: false,
    java21: false,
    java25: true,
    note: 'JDK 25 final (JEP 521)',
  },
];

export const VERSION_TIMELINE = [
  {version: 'Java 8', year: '2014', kind: 'LTS' as const, blurb: 'Modern Java baseline: lambdas, streams, CF'},
  {version: 'Java 11', year: '2018', kind: 'LTS' as const, blurb: 'Enterprise LTS: HTTP Client, modules cleanup'},
  {version: 'Java 17', year: '2021', kind: 'LTS' as const, blurb: 'Language modernization: records, sealed, PM'},
  {version: 'Java 21', year: '2023', kind: 'LTS' as const, blurb: 'Concurrency leap: virtual threads final'},
  {version: 'Java 25', year: '2025', kind: 'LTS' as const, blurb: 'Latest LTS: scoped values, AOT, compact headers'},
];
