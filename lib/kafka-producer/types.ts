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
  ack: string;
  retry: string;
  dup: string;
  loss: string;
  order: string;
  exception: string;
};
