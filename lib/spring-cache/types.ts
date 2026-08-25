export type TocItem = {id: string; label: string};

export type IQ = {
  id: string;
  topic: string;
  question: string;
  answer: string;
};

export type ConceptBlock = {
  title: string;
  what: string;
  why: string;
  architecture: string;
  code?: string;
  flow: string;
  internal: string;
  production: string;
  failure: string;
  interview: string;
  memory: string;
};
