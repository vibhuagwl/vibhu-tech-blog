export type TocItem = {id: string; label: string};

export type ConceptBlock = {
  id: string;
  title: string;
  why: string;
  analogy: string;
  flow: string;
  code?: string;
  diagram: string;
  finance: string;
  failure: string;
  debug: string;
  whenNot: string;
  interviewQ: string;
  hook: string;
};

export type DecisionRow = {requirement: string; choose: string; why: string};

export type AntiPattern = {
  id: string;
  title: string;
  why: string;
  impact: string;
  detect: string;
  better: string;
};

export type Incident = {
  id: string;
  title: string;
  signals: string;
  question: string;
  answer: string;
  fix: string;
};

export type InterviewQ = {
  id: string;
  level: 'mid' | 'senior' | 'staff' | 'architecture';
  question: string;
  testing: string;
  thought: string;
  strong: string;
  wrong: string;
  followUp: string;
};

export type ScenarioChoice = {
  id: string;
  name: string;
  situation: string;
  choose: string;
  why: string;
};
