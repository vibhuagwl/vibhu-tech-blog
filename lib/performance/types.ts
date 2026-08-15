export type TocItem = {id: string; label: string};

export type PerfTopic = {
  id: string;
  title: string;
  badge?: string;
  problem: string;
  detect: string;
  bad: string;
  good: string;
  whyFaster: string;
  tradeoff: string;
  interview30s: string;
  validate: string;
};

export type PlaybookScenario = {
  id: string;
  title: string;
  symptom: string;
  causes: string[];
  metrics: string[];
  tools: string[];
  rootCause: string;
  fix: string;
  validate: string;
};

export type CaseStudy = {
  id: string;
  title: string;
  architecture: string;
  before: string;
  rootCause: string;
  fix: string;
  after: string;
  interview: string;
};

export type InterviewQ = {
  id: string;
  level: 'beginner' | 'intermediate' | 'senior' | 'staff';
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  deepDive?: string;
  mistake?: string;
  followUps?: string[];
};

export type BeforeAfter = {
  id: string;
  title: string;
  problem: string;
  bad: string;
  whySlow: string;
  good: string;
  whyFaster: string;
  tradeoff: string;
  interview: string;
  validate: string;
};
