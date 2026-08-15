export type TocItem = {id: string; label: string};

export type CapSection = {
  id: string;
  title: string;
  what: string;
  why: string;
  how: string;
  example: string;
  failure: string;
  tradeoff: string;
  tech: string;
  trap: string;
  interviewAnswer: string;
  remember: string[];
  oneLiner: string;
  tables?: {headers: string[]; rows: string[][]}[];
};

export type InterviewQ = {
  id: string;
  topic: string;
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
  requirements: string;
  consistency: string;
  availability: string;
  partition: string;
  architecture: string;
  tradeoff: string;
  failure: string;
  recovery: string;
  interviewAnswer: string;
};

export type BehaviorPredict = {
  id: string;
  setup: string;
  expected: string;
  why: string;
  tradeoff: string;
};

export type PseudoExercise = {
  id: string;
  title: string;
  statement: string;
  approach: string;
  code: string;
  complexity: string;
  edgeCases: string[];
  interviewExplain: string;
};

export type Incident = {
  id: string;
  title: string;
  symptom: string;
  cause: string;
  investigate: string;
  fix: string;
  prevent: string;
};
