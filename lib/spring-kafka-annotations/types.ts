export type TocItem = {id: string; label: string};

export type AttrDoc = {
  name: string;
  what: string;
  why: string;
  when: string;
  example: string;
  impact: string;
};

export type InterviewQ = {
  id: string;
  level: 'Senior' | 'Staff' | 'Principal';
  question: string;
  short: string;
  deep: string;
  code: string;
  mistake: string;
  followUp: string;
};

export type GoldenAnswers = {
  problem: string;
  executes: string;
  owner: string;
  kafkaApi: string;
  offset: string;
  onFailure: string;
  createsTopic: string;
  createsProducer: string;
  createsConsumer: string;
  ordering: string;
  transactions: string;
  consumerGroups: string;
  risks: string;
  alternative: string;
  whenNot: string;
};
