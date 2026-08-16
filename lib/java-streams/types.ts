export type Difficulty =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'Staff'
  | 'Architect';

export type StreamCategory =
  | 'fundamentals'
  | 'filter'
  | 'map'
  | 'flatmap'
  | 'distinct'
  | 'sort'
  | 'limit-skip'
  | 'find-match'
  | 'reduce'
  | 'collectors'
  | 'grouping'
  | 'partitioning'
  | 'tomap-joining'
  | 'topn-nth'
  | 'duplicates-freq'
  | 'strings'
  | 'arrays-lists'
  | 'maps'
  | 'employee'
  | 'ecommerce'
  | 'fintech'
  | 'datetime-optional'
  | 'parallel'
  | 'advanced-collectors'
  | 'production';

export type TocItem = {id: string; label: string};

export type StreamProblem = {
  id: string;
  category: StreamCategory;
  difficulty: Difficulty;
  title: string;
  problem: string;
  input: string;
  output: string;
  solution: string;
  pipeline: string;
  why: string;
  timeComplexity: string;
  spaceComplexity: string;
  alternative?: string;
  trap: string;
  senior: string;
  tags?: string[];
  javaSince?: string;
};

export type ConceptBlock = {
  id: string;
  title: string;
  body: string;
  code?: string;
};

export type InterviewQ = {
  id: string;
  level: 'senior' | 'staff' | 'architect' | 'rapid';
  topic: string;
  question: string;
  answer30s: string;
  answer2m: string;
  followUps: string[];
  wrongAnswer?: string;
  seniorInsight?: string;
};

export type CodingRoundQ = {
  id: string;
  question: string;
  difficulty: Difficulty;
  expectedMinutes: number;
  approach: string;
  hints: string[];
  solution: string;
  complexity: string;
  followUp: string;
};

export type PredictionQ = {
  id: string;
  code: string;
  question: string;
  answer: string;
  explanation: string;
};

export type DebugQ = {
  id: string;
  badCode: string;
  bug: string;
  fix: string;
  lesson: string;
};

export type RankedProblem = {
  id: string;
  title: string;
  rank: 'must' | 'advanced' | 'expert' | 'staff';
  category: StreamCategory;
};
