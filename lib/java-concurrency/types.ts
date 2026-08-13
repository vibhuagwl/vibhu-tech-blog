export type StatusBadge =
  | 'FINAL'
  | 'PREVIEW'
  | 'INCUBATOR'
  | 'DEPRECATED'
  | 'REMOVED'
  | 'Introduced';

export type TocItem = {id: string; label: string};

export type TimelineFeature = {
  name: string;
  status: StatusBadge;
  note?: string;
};

export type TimelineEra = {
  version: string;
  year?: string;
  features: TimelineFeature[];
};

export type ApiCoverage = {
  name: string;
  pkg: string;
  introduced: string;
  java25: string;
  covered: boolean;
  code: boolean;
  diagram: boolean;
  production: boolean;
  interview: boolean;
};

export type TopicCard = {
  id: string;
  title: string;
  since: string;
  status?: StatusBadge;
  story: string;
  whenToUse: string;
  whenAvoid: string;
  methods: string[];
  internals: string;
  mermaid: string;
  brokenCode?: string;
  fixedCode: string;
  timeline: string;
  expectedOutput: string;
  production: string;
  pros: string[];
  cons: string[];
  interview30s: string;
  followUp: string;
  memoryTrick: string;
  whatHappensInternally: string;
};

export type InterviewQ = {
  id: string;
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  trick?: string;
};

export type Challenge = {
  id: string;
  title: string;
  code: string;
  prompts: string[];
  answer: string;
};

export type Mode = 'learning' | 'interview' | 'jvm' | 'production';
