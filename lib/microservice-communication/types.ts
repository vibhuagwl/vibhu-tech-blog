export type TocItem = {id: string; label: string};

export type CommSection = {
  id: string;
  title: string;
  what: string;
  why: string;
  when: string;
  how: string;
  flow: string;
  failure: string;
  tradeoff: string;
  security: string;
  observability: string;
  trap: string;
  interviewAnswer: string;
  remember: string[];
  oneLiner: string;
  /** Explicit problem this mechanism solves (interview framing). */
  problem?: string;
  /** When NOT to use — required nuance for senior answers. */
  whenNot?: string;
  pros?: string;
  cons?: string;
  badDesign?: string;
  goodDesign?: string;
  tables?: {headers: string[]; rows: string[][]}[];
};

export type InterviewQ = {
  id: string;
  topic: string;
  level: 'junior' | 'senior' | 'staff';
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  trick?: string;
  wrongAnswer?: string;
};

export type ScenarioQ = {
  id: string;
  title: string;
  recommended: string;
  why: string;
  alternative: string;
  tradeoffs: string;
  interviewAnswer: string;
};

export type Incident = {
  id: string;
  title: string;
  symptoms: string;
  metrics: string;
  logs: string;
  rootCause: string;
  mitigate: string;
  permanent: string;
  architecture: string;
  interviewAnswer: string;
};

export type StoryBeat = {
  id: string;
  title: string;
  badge: string;
  hook: string;
  mermaid: string;
  say: string;
  memory: string;
};
