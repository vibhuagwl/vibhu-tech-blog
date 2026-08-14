export type TocItem = {id: string; label: string};

export type InterviewQ = {
  id: string;
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  trick?: string;
};

export type InternalsSequence = {
  id: string;
  title: string;
  why: string;
  mermaid: string;
  ascii: string;
};
