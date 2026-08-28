export type TocItem = {id: string; label: string; group?: string};

export type SecTopic = {
  id: string;
  title: string;
  badge?: string;
  category: string;
  what: string;
  mermaid: string;
  code: string;
  verify?: string;
  pitfalls: string;
  production: string;
  interview30s: string;
  interview2m?: string;
  traps?: string;
  labHref?: string;
};

export type InterviewQ = {
  id: string;
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  traps?: string;
  labHref?: string;
};
