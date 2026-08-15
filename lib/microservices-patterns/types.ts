export type TocItem = {id: string; label: string};

export type PatternFrequency =
  | 'Frequently used'
  | 'Occasionally used'
  | 'Specialized'
  | 'Legacy'
  | 'Rare but interview-important';

export type PatternCard = {
  id: string;
  part: number;
  name: string;
  frequency: PatternFrequency;
  definition: string;
  problem: string;
  realWorld: string;
  whyExists: string;
  ascii: string;
  flow: string;
  components: {name: string; responsibility: string}[];
  javaCode: string;
  springCode?: string;
  config?: string;
  restApi?: string;
  kafkaCode?: string;
  dbCode?: string;
  redisCode?: string;
  unitTest: string;
  integrationTest?: string;
  failureTest?: string;
  concurrencyTest?: string;
  edgeCases: string[];
  failureScenarios: string[];
  retry: string;
  idempotency: string;
  timeout: string;
  observability: string;
  security: string;
  performance: string;
  scalability: string;
  production: string;
  mistakes: string[];
  antiPatterns: string[];
  alternatives: string[];
  tradeoffs: string;
  interviewQs: string[];
  trickyQs: string[];
  seniorFollowUps: string[];
  deepLabHref?: string;
};

export type InterviewQ = {
  id: string;
  level: 'basic' | 'intermediate' | 'senior' | 'lead' | 'scenario';
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  wrongAnswer: string;
  tradeoffs?: string;
  code?: string;
  trick?: string;
};

export type DecisionTree = {
  id: string;
  title: string;
  ascii: string;
};

export type MatrixRow = {
  pattern: string;
  problem: string;
  solution: string;
  tradeoff: string;
  interviewQ: string;
};
