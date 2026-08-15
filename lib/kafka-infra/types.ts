export type TocItem = {id: string; label: string};

export type ComponentCard = {
  id: string;
  name: string;
  what: string;
  why: string;
  howMany: string;
  ifFails: string;
  scales: string;
  monitored: string;
  interviewQs: string[];
};

export type FailureScenario = {
  id: string;
  title: string;
  architecture?: string;
  symptoms: string[];
  causes: string[];
  metrics: string[];
  logs: string[];
  tempFix: string[];
  permanentFix: string[];
  tradeoffs: string;
  interviewAnswer: string;
};

export type InterviewQ = {
  id: string;
  topic: string;
  question: string;
  intent: string;
  answer30s: string;
  answer2m: string;
  architecture?: string;
  tradeoffs: string;
  mistakes: string[];
  followUps: string[];
};

export type Runbook = {
  id: string;
  incident: string;
  severity: string;
  first5: string[];
  check: string[];
  temp: string[];
  root: string;
  permanent: string[];
  validation: string[];
  prevention: string[];
};

export type SectionBlock = {
  id: string;
  part: number;
  title: string;
  lead: string;
  ascii?: string;
  body: string;
  remember: string[];
  oneLiner: string;
  trap: string;
  tables?: {headers: string[]; rows: string[][]}[];
};
