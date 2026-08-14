import type {DsaApproach} from './types';

/**
 * Brute force → better → optimized for each sliding-window catalog id.
 * Time/space are derived, not slogans: say which loop moves how many times.
 */
export const WINDOW_APPROACHES: Record<string, DsaApproach[]> = {
  'max-sum-k': [
    {
      name: 'Brute force',
      idea: 'For every start i, sum a[i..i+K-1] from scratch. (N−K+1) windows × K adds.',
      time: 'O(NK)',
      space: 'O(1)',
      why: 'Each of ~N starts rescans K cells. Overlap is ignored, so work is quadratic in the usual K≈N/2 case.',
      java: `long brute(int[] a, int k) {
  long best = Long.MIN_VALUE;
  for (int i = 0; i + k <= a.length; i++) {
    long sum = 0;
    for (int j = i; j < i + k; j++) sum += a[j];
    best = Math.max(best, sum);
  }
  return best;
}`,
    },
    {
      name: 'Optimized',
      idea: 'Sum the first K cells once. Each slide: add a[r], subtract a[r−K]. Track max. Every index is added once and removed once.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'First window O(K), then N−K slides of O(1). Total O(N). No extra arrays.',
    },
  ],
  'max-average': [
    {
      name: 'Brute force',
      idea: 'Average every block of length K independently (sum / K).',
      time: 'O(NK)',
      space: 'O(1)',
      why: 'Same as max-sum-K brute. Division does not change the asymptotic.',
    },
    {
      name: 'Optimized',
      idea: 'Max average of fixed K is max sum / K. Slide the sum, divide once at the end (or divide the running best).',
      time: 'O(N)',
      space: 'O(1)',
      why: 'One pass over N cells. Space is a few doubles.',
    },
  ],
  'first-negative-k': [
    {
      name: 'Brute force',
      idea: 'For each window, scan left-to-right until you see a negative (or the window ends).',
      time: 'O(NK)',
      space: 'O(1) extra',
      why: 'Up to K probes per start, ~N starts.',
    },
    {
      name: 'Optimized',
      idea: 'Deque of indices of negatives. Pop front when the index left the window. Front is the first negative still inside.',
      time: 'O(N)',
      space: 'O(K)',
      why: 'Each index is pushed and popped at most once → O(N). Deque holds at most the negatives in the current window, ≤ K.',
    },
  ],
  'sw-max': [
    {
      name: 'Brute force',
      idea: 'For each start, scan the K cells for the max.',
      time: 'O(NK)',
      space: 'O(1) extra besides the answer array',
      why: 'N−K+1 windows × K comparisons.',
    },
    {
      name: 'Better',
      idea: 'TreeMap or heap of the window. Each slide: insert O(log K), delete O(log K).',
      time: 'O(N log K)',
      space: 'O(K)',
      why: 'Logarithmic structure per update. Correct, slower than a deque, fine if K is tiny.',
      java: `// TreeMap<Integer,Integer> freq of the window
// add a[r], remove a[r-k], answer = freq.lastKey()`,
    },
    {
      name: 'Optimized',
      idea: 'Monotonic decreasing deque of indices. Pop back while a[back] ≤ a[i] (they can never be max after i). Pop front if it expired. Front is the window max.',
      time: 'O(N)',
      space: 'O(K)',
      why: 'Each index enters and leaves the deque at most once. Amortized O(1) per i. Deque size ≤ K.',
    },
  ],
  'contains-dup-ii': [
    {
      name: 'Brute force',
      idea: 'For every i, scan j in (i+1 .. min(n, i+K)) and compare values.',
      time: 'O(NK)',
      space: 'O(1)',
      why: 'Up to K comparisons per index.',
    },
    {
      name: 'Optimized',
      idea: 'HashSet of the last K values (or map value → last index). If add fails, a duplicate sits inside the window. Remove a[i−K] when the window grows past K.',
      time: 'O(N) expected',
      space: 'O(K)',
      why: 'HashSet add/remove is expected O(1). At most K keys live in the set.',
    },
  ],
  anagrams: [
    {
      name: 'Brute force',
      idea: 'For every start, copy the substring of length |p|, sort it, compare to sorted p.',
      time: 'O(N K log K) with K=|p|',
      space: 'O(K)',
      why: 'Sort dominates each window. N windows.',
    },
    {
      name: 'Better',
      idea: 'Count 26 letters in each window from scratch and compare to need[].',
      time: 'O(N · 26) = O(NK) if you rebuild, or O(N) if you slide counts',
      space: 'O(1) alphabet',
      why: 'Alphabet is constant. Rebuilding the window is still O(NK); sliding the two counts is O(N).',
    },
    {
      name: 'Optimized',
      idea: 'Slide a window of |p|. Maintain have[] vs need[] and a match counter of how many letters currently hit the needed frequency.',
      time: 'O(|s|)',
      space: 'O(1)',
      why: 'Each character enters once and leaves once. 26-size arrays are O(1).',
    },
  ],
  'perm-in-string': [
    {
      name: 'Brute force',
      idea: 'Generate every permutation of s1 (or recurse) and search in s2. Exponential.',
      time: 'O(|s1|! · |s2|)',
      space: 'O(|s1|)',
      why: 'Permutations explode. This is not an interview solution.',
    },
    {
      name: 'Optimized',
      idea: 'Anagram window of length |s1| inside s2. Same as LC 438; return true on the first match.',
      time: 'O(|s2|)',
      space: 'O(1)',
      why: 'Fixed window of |s1|, each s2 index processed twice (enter/leave).',
    },
  ],
  'vowels-k': [
    {
      name: 'Brute force',
      idea: 'Count vowels in every substring of length K.',
      time: 'O(NK)',
      space: 'O(1)',
      why: 'Rescan K chars per start.',
    },
    {
      name: 'Optimized',
      idea: 'Running vowel count. Incoming vowel ++, outgoing vowel --.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'One pass. Boolean[128] for vowels is O(1).',
    },
  ],
  'ones-iii': [
    {
      name: 'Brute force',
      idea: 'Try every [L,R]. Count zeros in the range. If zeros ≤ K, update max length.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'O(N²) pairs. Counting zeros naively inside is O(N³); a prefix of zeros makes it O(N²).',
      java: `int brute(int[] a, int k) {
  int best = 0;
  for (int l = 0; l < a.length; l++) {
    int zeros = 0;
    for (int r = l; r < a.length; r++) {
      if (a[r] == 0) zeros++;
      if (zeros > k) break;
      best = Math.max(best, r - l + 1);
    }
  }
  return best;
}`,
    },
    {
      name: 'Optimized',
      idea: 'Longest window with at most K zeros. Expand right; while zeros > K, advance left.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'right moves N times, left moves at most N times. Nested-looking while is amortized O(1) per step.',
    },
  ],
  'longest-no-repeat': [
    {
      name: 'Brute force',
      idea: 'For every L,R check that s[L..R] has unique chars (set or boolean[256]).',
      time: 'O(N²) with a sliding set per L, or O(N³) if you rebuild the set each R',
      space: 'O(alphabet)',
      why: 'Quadratic pairs of endpoints. Hashing inside the pair is extra.',
    },
    {
      name: 'Optimized',
      idea: 'last[c] = last index of c. If last[c] ≥ left, jump left to last[c]+1. Window is always unique.',
      time: 'O(N)',
      space: 'O(alphabet) — 256 or HashMap',
      why: 'Each index visited once. Jumping left never goes backward, so left is monotone.',
    },
  ],
  'k-distinct': [
    {
      name: 'Brute force',
      idea: 'Every substring: count distinct with a map, keep the longest with size ≤ K.',
      time: 'O(N²)',
      space: 'O(min(N, alphabet))',
      why: 'O(N²) ranges; map operations hide a small extra factor.',
    },
    {
      name: 'Optimized',
      idea: 'Grow right. While map.size() > K, decrement s[left] and drop empty keys. Track max length.',
      time: 'O(N)',
      space: 'O(K)',
      why: 'Each char added once and removed once. Map holds at most K+1 keys.',
    },
  ],
  'two-distinct': [
    {
      name: 'Brute force',
      idea: 'Same as K-distinct brute with K=2.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'Quadratic ranges; at most 2 keys in a map is O(1) space even in brute.',
    },
    {
      name: 'Optimized',
      idea: 'Call the K-distinct window with K=2. Same as fruit baskets.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Map size ≤ 3 during shrink. Constant.',
    },
  ],
  'fruit-baskets': [
    {
      name: 'Brute force',
      idea: 'Try every start tree, walk right until a third type appears, record length.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'Each start can scan the rest of the row.',
    },
    {
      name: 'Optimized',
      idea: 'Longest subarray with at most 2 distinct values. Identical to LC 159.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Two-pointer + map of size ≤ 3. Each index enters/leaves once.',
    },
  ],
  'char-replacement': [
    {
      name: 'Brute force',
      idea: 'For each window, count the majority letter (26 or a map). Valid if length − majority ≤ K.',
      time: 'O(N²) with rolling counts, O(N² · 26) if you rescan',
      space: 'O(1)',
      why: 'Quadratic windows; 26 is constant.',
    },
    {
      name: 'Optimized',
      idea: 'Same check on a growing window: length − maxFreq ≤ K. Shrink left when invalid. maxFreq is the best count seen in the window.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'right and left each move ≤ N. Frequency array of 26. You do not need maxFreq to decrease perfectly — length only grows when the invariant holds.',
    },
  ],
  'min-window': [
    {
      name: 'Brute force',
      idea: 'Every substring of s: check whether it covers t (counts). Keep the shortest that does.',
      time: 'O(N² · |Σ|) or O(N² · |t|)',
      space: 'O(|Σ|)',
      why: 'O(N²) substrings, each compared to t.',
    },
    {
      name: 'Optimized',
      idea: 'Need-map of t. Expand right until have==need. Then shrink left while still covering, record best, repeat.',
      time: 'O(|s| + |t|)',
      space: 'O(|Σ|)',
      why: 'Each s index enters once and leaves once. Building need is O(|t|). Alphabet arrays are O(1) for ASCII.',
    },
  ],
  'min-size-sum': [
    {
      name: 'Brute force',
      idea: 'Every L,R: if sum(a[L..R]) ≥ target, take min length.',
      time: 'O(N²) with prefix sums, O(N³) if you rescan',
      space: 'O(N) prefixes or O(1)',
      why: 'Quadratic pairs. Prefix makes the inner sum O(1).',
    },
    {
      name: 'Better',
      idea: 'Prefix sums + binary search for the earliest prefix ≥ prefix[r]−target+… (only if all positive).',
      time: 'O(N log N)',
      space: 'O(N)',
      why: 'Monotone prefixes → binary search per right endpoint.',
    },
    {
      name: 'Optimized',
      idea: 'All values positive ⇒ sum is monotone. Expand right, shrink left while sum ≥ target, track min length.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'left and right move at most N times. No prefix array.',
    },
  ],
  'product-less-k': [
    {
      name: 'Brute force',
      idea: 'Every subarray: compute product (watch overflow), count if < K.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'O(N²) ranges; running product per L is O(N²) not O(N³).',
    },
    {
      name: 'Optimized',
      idea: 'Positive numbers ⇒ product is monotone. Shrink while product ≥ K. Add (r−left+1) subarrays ending at r.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Two pointers. Each index is multiplied in and divided out at most once. Use long.',
    },
  ],
  'nice-subarrays': [
    {
      name: 'Brute force',
      idea: 'Every L,R: count odds in the range, ++answer if count == K.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'Prefix of odd-counts makes inner check O(1), still O(N²) pairs.',
    },
    {
      name: 'Optimized',
      idea: 'Odds → 1, evens → 0. exactly(K) = atMost(K) − atMost(K−1). atMost uses a window on the odd budget.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Two O(N) atMost passes. left/right monotone in each.',
    },
  ],
  'binary-sum': [
    {
      name: 'Brute force',
      idea: 'Every subarray sum (prefix) equals goal.',
      time: 'O(N²)',
      space: 'O(N) prefixes',
      why: 'Quadratic endpoints.',
    },
    {
      name: 'Better',
      idea: 'Prefix-sum HashMap: count how often prefix−goal was seen. Classic subarray-sum-equals-K.',
      time: 'O(N) expected',
      space: 'O(N)',
      why: 'One pass, map of prefixes. Works with any integers, not only binary.',
    },
    {
      name: 'Optimized',
      idea: 'Binary + non-negative ⇒ window atMost(goal) − atMost(goal−1). O(1) extra memory.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Two monotone windows. Prefer this in a sliding-window round; mention the HashMap as the general tool.',
    },
  ],
  'k-different': [
    {
      name: 'Brute force',
      idea: 'Every subarray: HashSet of values, count when size == K.',
      time: 'O(N²)',
      space: 'O(N)',
      why: 'Quadratic ranges; set can hold the whole array in the worst window.',
    },
    {
      name: 'Optimized',
      idea: 'atMost(K) − atMost(K−1) with a frequency map of distinct keys.',
      time: 'O(N)',
      space: 'O(K)',
      why: 'Each index added/removed once per atMost pass. Map ≤ K+1 keys.',
    },
  ],
  'three-chars': [
    {
      name: 'Brute force',
      idea: 'Every substring: check it contains a, b, and c.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'Quadratic ranges; 3 flags.',
    },
    {
      name: 'Optimized',
      idea: 'Track last index of a,b,c. When all are seen, every start ≤ min(last) forms a valid substring ending at r. Or: total − atMost(2 distinct).',
      time: 'O(N)',
      space: 'O(1)',
      why: 'One pass, three integers. Each r contributes start+1 in O(1).',
    },
  ],
  'equal-budget': [
    {
      name: 'Brute force',
      idea: 'Cost[i]=|s[i]-t[i]|. Every subarray of cost, keep longest with sum ≤ maxCost.',
      time: 'O(N²)',
      space: 'O(1) or O(N) if you materialize cost[]',
      why: 'Quadratic ranges; costs are ≥ 0 so prefix sums also O(N²).',
    },
    {
      name: 'Optimized',
      idea: 'Longest subarray of non-negative costs with sum ≤ budget. Expand/shrink.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Monotone sum. left and right move ≤ N. No extra cost array required.',
    },
  ],
  'freq-most': [
    {
      name: 'Brute force',
      idea: 'For each target value, try to make a window all equal to it using ≤ K increments. Without sort this is messy.',
      time: 'O(N²) after sort if you rescan each window',
      space: 'O(1)',
      why: 'Need sort to make “become a[r]” well-defined. Naive inner sum is extra.',
    },
    {
      name: 'Optimized',
      idea: 'Sort. Window [L,R] can all become a[R] iff a[R]·length − sum(window) ≤ K. Shrink L while that fails.',
      time: 'O(N log N) sort + O(N) window',
      space: 'O(1) extra besides sort',
      why: 'Sort dominates. Window is linear because a[R] is non-decreasing after sort and sum is monotone in L.',
    },
  ],
  'max-answers': [
    {
      name: 'Brute force',
      idea: 'Every window: count T and F. Valid if min(T,F) ≤ K (you flip the minority). Track max length.',
      time: 'O(N²)',
      space: 'O(1)',
      why: 'Quadratic windows; two counters.',
    },
    {
      name: 'Optimized',
      idea: 'Longest T-run with ≤ K flips plus longest F-run with ≤ K flips (Ones III twice). Take max.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Two linear passes. Same amortized two-pointer argument as LC 1004.',
    },
  ],
  'cards-points': [
    {
      name: 'Brute force',
      idea: 'Try taking i cards from the left and K−i from the right for i=0..K. Sum each.',
      time: 'O(K²) if you rescan, O(K) if you keep prefix/suffix',
      space: 'O(1) or O(K)',
      why: 'K+1 choices. Rescanning each pair of ends is O(K²); prefixes make it O(K).',
    },
    {
      name: 'Optimized',
      idea: 'Max ends = total − min middle window of length n−K. Slide a fixed window of the leftover.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'One total sum plus one fixed-length min-sum. Equivalent to the O(K) prefix/suffix method when K≈N.',
    },
  ],
  grumpy: [
    {
      name: 'Brute force',
      idea: 'For every placement of the X-minute technique, simulate happiness.',
      time: 'O(NX)',
      space: 'O(1)',
      why: 'N possible starts, X minutes rescanned.',
    },
    {
      name: 'Optimized',
      idea: 'Base = already-happy (grumpy=0). Extra = max sum of customers[i] on grumpy minutes inside a window of X.',
      time: 'O(N)',
      space: 'O(1)',
      why: 'Fixed window on the “unhappy” contribution. Enter/leave O(1).',
    },
  ],
  'sw-median': [
    {
      name: 'Brute force',
      idea: 'Copy each window of K, sort, pick the middle (or two middles).',
      time: 'O(N K log K)',
      space: 'O(K)',
      why: 'N−K+1 sorts of K elements.',
    },
    {
      name: 'Optimized',
      idea: 'Two heaps (max-heap low, min-heap high) + lazy deletion of values that left the window. Rebalance so low.size() is equal or one larger. Median is low.peek() or the average of both peaks.',
      time: 'O(N log K)',
      space: 'O(K)',
      why: 'Each insert/delete is O(log K). Lazy delete can leave stale heap entries; the delayed map bounds live keys to the window. Not a deque — deque is for min/max, not rank.',
    },
  ],
};

export function approachesFor(id: string, fallback: {idea: string; time: string; space: string; java: string}): DsaApproach[] {
  const listed = WINDOW_APPROACHES[id];
  if (listed?.length) {
    return listed.map((a, i) =>
      i === listed.length - 1 && a.name === 'Optimized' && !a.java
        ? {...a, java: fallback.java}
        : a
    );
  }
  return [
    {
      name: 'Brute force',
      idea: 'Try every subarray and recompute the score.',
      time: 'O(N²) or worse',
      space: 'O(1)',
      why: 'Nested start/end loops ignore overlap.',
    },
    {
      name: 'Optimized',
      idea: fallback.idea,
      time: fallback.time,
      space: fallback.space,
      why: 'Each index enters and leaves the window at most once.',
      java: fallback.java,
    },
  ];
}
