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

export type ComboResult = {
  map: string;
  size: number;
  get: string;
  buckets: string;
  note: string;
};

export type Combo = {
  id: string;
  title: string;
  hashCode: string;
  equals: string;
  contractOk: boolean;
  results: ComboResult[];
  java: string;
};
