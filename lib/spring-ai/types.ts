export type TocItem = {id: string; label: string};

export type InterviewBlock = {
  concept: string;
  s30: string;
  s2m: string;
  s10m: string;
  principal: string;
  followUps: string[];
  strong: string;
  wrong: string;
  example: string;
};

export type IQ = {
  id: string;
  topic: string;
  question: string;
  answer: string;
};

export type Adr = {
  id: string;
  title: string;
  context: string;
  decision: string;
  alternatives: string;
  consequences: string;
};

export type Mistake = {
  bad: string;
  why: string;
  better: string;
};

export type Phase = {
  id: string;
  title: string;
  outcome: string;
};
