export type TocItem = {id: string; label: string};

export type Mechanism = {
  id: string;
  name: string;
  since: string;
  problemTitle: string;
  problem: string;
  brokenCode: string;
  bugTrace: string;
  bugLabel: string;
  fixedCode: string;
  fixTrace: string;
  expectedOutput: string;
  outputNote?: string;
  mermaid: string;
  whyFixWorks: string;
  whenNot: string;
  alternative: string;
  interview30s: string;
  seniorFollowUp: string;
  productionFollowUp: string;
  memoryTrick: string;
  beforeAfter: {without: string; with: string}[];
  tabs?: {
    theory?: string;
    production?: string;
    internals?: string;
  };
};

export type TimelineItem = {
  version: string;
  features: {
    name: string;
    why: string;
    solved: string;
    before: string;
    modern: string;
    stillUsed: boolean;
  }[];
};

export type InterviewQ = {
  id: string;
  question: string;
  short: string;
  detailed: string;
  code?: string;
  mistake: string;
  followUp: string;
};

export type ScenarioPick = {
  id: string;
  scenario: string;
  answer: string;
  code: string;
  why: string;
};

export type WrongChoice = {
  wrong: string;
  looksCorrect: string;
  actuallyWrong: string;
  correct: string;
};

export type ProdProblem = {
  id: string;
  title: string;
  bad: string;
  execution: string;
  rootCause: string;
  solution: string;
  why: string;
};
