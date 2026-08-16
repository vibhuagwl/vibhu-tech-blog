export type TocItem = {id: string; label: string};

export type InterviewQ = {
  id: string;
  level: 'senior' | 'architect' | 'principal' | 'rapid';
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  expects?: string;
  wrongAnswer?: string;
  seniorInsight?: string;
  trick?: string;
};

export type Incident = {
  id: string;
  title: string;
  symptom: string;
  investigation: string;
  rootCause: string;
  fix: string;
  prevention: string;
};

export type ConceptRow = {
  name: string;
  definition: string;
  controls: string;
  typicalResponse: string;
};
