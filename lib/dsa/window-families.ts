import type {WindowFamily} from './types';

/** Similar problems sit in one family so 100+ windows stay scannable. */
export const WINDOW_FAMILIES: WindowFamily[] = [
  {
    id: 'fixed-sum',
    title: 'Fixed length — running sum',
    blurb: 'Every window has size K. Add the newcomer, drop the leaver.',
    invariant: 'Window length is constant. State is a running sum or count.',
    problemIds: ['max-sum-k', 'max-average', 'vowels-k', 'cards-points', 'grumpy'],
  },
  {
    id: 'fixed-freq',
    title: 'Fixed length — set / frequency',
    blurb: 'Window of length K or |p|. HashSet or 26-count tells you if the block is valid.',
    invariant: 'Length is fixed. Compare frequency vectors or membership.',
    problemIds: ['contains-dup-ii', 'anagrams', 'perm-in-string'],
  },
  {
    id: 'deque',
    title: 'Monotonic deque / window extrema',
    blurb: 'Need min, max, first-negative, or median inside each window — not the sum.',
    invariant: 'Deque (or two heaps) stores candidates in order. Front is the answer.',
    problemIds: ['first-negative-k', 'sw-max', 'sw-median'],
  },
  {
    id: 'longest',
    title: 'Longest window that still obeys a rule',
    blurb: 'Grow right. Shrink left while the window is invalid. Track max length.',
    invariant: 'Maximize r−l+1 under a budget (distinct chars, zeros, cost, replacements).',
    problemIds: [
      'ones-iii',
      'longest-no-repeat',
      'k-distinct',
      'two-distinct',
      'fruit-baskets',
      'char-replacement',
      'equal-budget',
      'freq-most',
      'max-answers',
    ],
  },
  {
    id: 'shortest',
    title: 'Shortest window that becomes valid',
    blurb: 'Grow until the constraint is met, then starve the left while it stays met.',
    invariant: 'Minimize r−l+1 among windows that cover a target or sum.',
    problemIds: ['min-window', 'min-size-sum'],
  },
  {
    id: 'count',
    title: 'Count subarrays — atMost trick',
    blurb: 'Exactly K = atMost(K) − atMost(K−1). Each valid [L,R] contributes R−L+1 endings.',
    invariant: 'Count windows, do not just take min/max length.',
    problemIds: ['product-less-k', 'nice-subarrays', 'binary-sum', 'k-different', 'three-chars'],
  },
];

export function familyForProblem(problemId: string): WindowFamily | undefined {
  return WINDOW_FAMILIES.find((f) => f.problemIds.includes(problemId));
}
