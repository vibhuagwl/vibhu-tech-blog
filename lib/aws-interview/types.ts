export type TocItem = {id: string; label: string; group?: string};

export type AwsTopic = {
  id: string;
  title: string;
  badge?: string;
  category: string;
  askLevel?: '⭐ MOST ASKED' | '🔥 SENIOR' | '🏆 STAFF';
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
  level: 'Beginner' | 'Intermediate' | 'Senior' | 'Staff';
  tag?: '⭐' | '🔥' | '🏆';
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  production?: string;
  mistake?: string;
  followUps: string[];
};
