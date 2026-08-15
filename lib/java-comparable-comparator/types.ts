export type TocItem = {id: string; label: string};

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

export type ConceptBlock = {
  id: string;
  title: string;
  what: string;
  why: string;
  how: string;
  code: string;
  realWorld: string;
  mistake: string;
  trap: string;
  interviewAnswer: string;
};

export type OutputPredict = {
  id: string;
  code: string;
  expected: string;
  why: string;
  trap: string;
};

export type CodingProblem = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  statement: string;
  approach: string;
  code: string;
  complexity: string;
  edgeCases: string[];
  interviewExplain: string;
};
