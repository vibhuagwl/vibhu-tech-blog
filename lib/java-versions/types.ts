export type FeatureStatus =
  | 'LTS'
  | 'Feature Release'
  | 'FINAL'
  | 'PREVIEW'
  | 'INCUBATOR'
  | 'EXPERIMENTAL'
  | 'DEPRECATED'
  | 'REMOVED';

export type TocItem = {
  id: string;
  label: string;
  children?: {id: string; label: string}[];
};

export type CodePair = {
  title: string;
  oldLabel: string;
  newLabel: string;
  old: string;
  new: string;
  whatChanged: string;
  why: string;
  workload: string;
  newBottleneck: string;
};

export type FeatureCard = {
  name: string;
  status?: FeatureStatus;
  jep?: string;
  problem: string;
  before: string;
  solution: string;
  production: string;
  interview: string;
  code?: string;
  codeBefore?: string;
};

export type VersionSection = {
  id: string;
  version: string;
  year: string;
  lts: boolean;
  overview: string;
  whyMatters: string;
  majorFeatures: FeatureCard[];
  language: string[];
  api: string[];
  jvm: string[];
  gc: string[];
  concurrency: string[];
  security: string[];
  performance: string[];
  deprecated: string[];
  removed: string[];
  productionUsage: string[];
  migrationImpact: string[];
  seniorTopics?: {title: string; body: string}[];
  codePairs: CodePair[];
  interviewQuestions: string[];
  architectQuestions: string[];
  commonMistakes: string[];
};

export type InterviewQuestion = {
  id: string;
  topic:
    | 'Java 8'
    | 'Java 11'
    | 'Java 17'
    | 'Java 21'
    | 'Java 25'
    | 'Migration'
    | 'JVM'
    | 'Concurrency'
    | 'Architecture';
  difficulty: 'Senior' | 'Staff' | 'Principal' | 'Architect' | '25+ Years';
  question: string;
  answer: string;
  keyPoints: string[];
  followUp: string;
  productionExample: string;
};

export type Scenario = {
  id: string;
  title: string;
  scenario: string;
  answer: string;
  pillars: string[];
};
