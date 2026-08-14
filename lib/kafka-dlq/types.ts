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

export type FailureRow = {
  failure: string;
  retry: string;
  dlt: string;
  commit: string;
  dup: string;
  loss: string;
  alert: string;
};
