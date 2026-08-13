export type TocItem = {id: string; label: string};

export type CamundaTopic = {
  id: string;
  title: string;
  badge?: string;
  theory: string;
  whenToUse: string;
  whenAvoid: string;
  mermaid: string;
  code: string;
  bpmn: string;
  production: string;
  interview30s: string;
  mistakes: string[];
  followUp: string;
  memoryTrick: string;
};

export type InterviewQ = {
  id: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Senior' | 'Architect';
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  trick?: string;
};

export type TableRow = Record<string, string>;
