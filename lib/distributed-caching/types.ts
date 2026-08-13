export type TocItem = {id: string; label: string};

export type CacheTopic = {
  id: string;
  title: string;
  badge?: string;
  problem: string;
  whenToUse: string;
  whenAvoid: string;
  mermaid: string;
  code: string;
  failure: string;
  production: string;
  interview30s: string;
  followUp: string;
  tradeoff: string;
  memoryTrick: string;
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

export type MatrixRow = {
  name: string;
  distributed: string;
  persistence: string;
  replication: string;
  spring: string;
  best: string;
  drawback: string;
};
