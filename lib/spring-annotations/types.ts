export type TocItem = {id: string; label: string};

export type AnnotationCard = {
  id: string;
  annotation: string;
  family: string;
  what: string;
  why: string;
  example: string;
  processor: string;
  when: string;
  flow: string;
  lifecycle: string;
  proxy: string;
  runtime: string;
  failure: string;
  debug: string;
  production: string;
  mistakes: string[];
  traps: string[];
  answer15s: string;
  answer60s: string;
  answer3m: string;
  memory: string;
  tables?: {headers: string[]; rows: string[][]}[];
};

export type InterviewQ = {
  id: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'senior' | 'staff';
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
  symptom: string;
  cause: string;
  mechanism: string;
  debug: string;
  fix: string;
  prevent: string;
  interviewAnswer: string;
};

export type ProcessorRow = {
  annotation: string;
  processor: string;
  proxy: string;
  phase: string;
  trap: string;
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
