export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';

export type IslandPattern = 'DFS' | 'BFS' | 'DFS or BFS' | 'BFS then DFS' | 'Union-Find';

export type WindowKind = 'Fixed' | 'Variable longest' | 'Variable shortest' | 'At most / at least' | 'Deque';

export type TocItem = {id: string; label: string; group?: string};

export type DsaApproach = {
  name: 'Brute force' | 'Better' | 'Optimized';
  idea: string;
  time: string;
  space: string;
  why: string;
  java?: string;
};

export type DsaProblem = {
  id: string;
  lc: string;
  title: string;
  difficulty: DsaDifficulty;
  pattern: string;
  statement: string;
  example: string;
  idea: string;
  java: string;
  time: string;
  space: string;
  pitfalls: string[];
  remember: string;
  approaches?: DsaApproach[];
};

export type WindowFamily = {
  id: string;
  title: string;
  blurb: string;
  invariant: string;
  problemIds: string[];
};
