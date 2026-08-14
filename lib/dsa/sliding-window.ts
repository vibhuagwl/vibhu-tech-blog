import type {DsaProblem} from './types';

export const WINDOW_SENTENCE =
  'Right expands the window, left shrinks it. Each index enters and leaves at most once, so nested-looking loops are O(N).';

export const WINDOW_MAP = `flowchart TB
  ARR[Array or string]
  ARR --> FIX[Fixed size K]
  ARR --> VAR[Variable size]
  FIX --> ADD[Add right, drop left]
  VAR --> GROW[Grow right while invalid or valid]
  VAR --> SHRINK[Shrink left to restore invariant]
  ADD --> DEQUE[Deque for max/min]
  GROW --> HASH[HashMap counts]
  SHRINK --> HASH`;

export const WINDOW_WHEN: {need: string; kind: string; example: string}[] = [
  {need: 'Every block of exactly K', kind: 'Fixed', example: 'Max sum of size K, anagrams of length P'},
  {need: 'Longest that still obeys a rule', kind: 'Variable longest', example: 'No repeat chars, at most K distinct, fruit baskets'},
  {need: 'Shortest that becomes valid', kind: 'Variable shortest', example: 'Min window substring, min size subarray sum'},
  {need: 'Count windows with a score', kind: 'At most / at least', example: 'Product < K, exactly K distinct = atMost(K)-atMost(K-1)'},
  {need: 'Max/min inside the window', kind: 'Deque', example: 'Sliding window maximum'},
];

export const SLIDING_WINDOW_PROBLEMS: DsaProblem[] = [
  {
    id: 'max-sum-k',
    lc: '—',
    title: 'Maximum Sum of Subarray of Size K',
    difficulty: 'Easy',
    pattern: 'Fixed',
    statement:
      'Given an integer array and a window length K, return the maximum sum of any contiguous subarray of length exactly K.',
    example: 'a = [2, 1, 5, 1, 3, 2], K = 3 → 5+1+3 = 9.',
    idea: 'Sum the first K cells, then slide: add a[right], subtract a[right-K]. Track the max.',
    java: `long maxSum(int[] a, int k) {
  long sum = 0, best;
  for (int i = 0; i < k; i++) sum += a[i];
  best = sum;
  for (int r = k; r < a.length; r++) {
    sum += a[r] - a[r - k];
    best = Math.max(best, sum);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Recomputing the inner sum each start is O(NK). Off-by-one when K equals n.'],
    remember: 'Add the newcomer, drop the leaver. That is the whole fixed window.',
  },
  {
    id: 'max-average',
    lc: '643',
    title: 'Maximum Average Subarray I',
    difficulty: 'Easy',
    pattern: 'Fixed',
    statement:
      'Find a contiguous subarray of length K with the maximum average. Return that average as a double.',
    example: '[1,12,-5,-6,50,3], K=4 → 12.75 from [-5,-6,50,3] wait — actually [12,-5,-6,50] = 12.75.',
    idea: 'Max average of fixed length is the max sum divided by K. Same as max-sum-K.',
    java: `double findMaxAverage(int[] a, int k) {
  double sum = 0;
  for (int i = 0; i < k; i++) sum += a[i];
  double best = sum;
  for (int r = k; r < a.length; r++) {
    sum += a[r] - a[r - k];
    best = Math.max(best, sum);
  }
  return best / k;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Integer division. Use double. Do not average at every step if you can divide once at the end.'],
    remember: 'Average is a monotone of the sum for fixed K.',
  },
  {
    id: 'first-negative-k',
    lc: '—',
    title: 'First Negative in Every Window of Size K',
    difficulty: 'Easy',
    pattern: 'Fixed',
    statement:
      'For every contiguous window of size K, print the first negative number in that window, or 0 if the window has no negative.',
    example: '[12, -1, -7, 8, -15, 30, 16, 28], K=3 → -1, -1, -7, -15, -15, 0.',
    idea: 'Keep a deque of indices of negatives. Pop from the front if they left the window. Front is the first negative.',
    java: `int[] firstNeg(int[] a, int k) {
  ArrayDeque<Integer> dq = new ArrayDeque<>();
  int n = a.length, idx = 0;
  int[] ans = new int[n - k + 1];
  for (int i = 0; i < n; i++) {
    if (a[i] < 0) dq.addLast(i);
    if (i < k - 1) continue;
    while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
    ans[idx++] = dq.isEmpty() ? 0 : a[dq.peekFirst()];
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(K)',
    pitfalls: ['Storing values instead of indices makes expiry checks messy when duplicates exist.'],
    remember: 'Deque of negative indices. Front = first negative still inside the window.',
  },
  {
    id: 'sw-max',
    lc: '239',
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    pattern: 'Deque',
    statement:
      'Return an array of the maximum value in every contiguous window of size K.',
    example: '[1,3,-1,-3,5,3,6,7], K=3 → [3,3,5,5,6,7].',
    idea:
      'Monotonic decreasing deque of indices. The front is the max. Pop back while the new value is larger. Pop front when it leaves the window.',
    java: `int[] maxSlidingWindow(int[] a, int k) {
  ArrayDeque<Integer> dq = new ArrayDeque<>();
  int[] ans = new int[a.length - k + 1];
  for (int i = 0; i < a.length; i++) {
    while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
    dq.addLast(i);
    if (dq.peekFirst() <= i - k) dq.pollFirst();
    if (i >= k - 1) ans[i - k + 1] = a[dq.peekFirst()];
  }
  return ans;
}`,
    time: 'O(N) — each index pushed/popped once',
    space: 'O(K)',
    pitfalls: ['TreeMap per window is O(N log K). Heap lazy-delete is messier. Deque is the interview answer.'],
    remember: 'Decreasing deque. Front is the window max.',
  },
  {
    id: 'contains-dup-ii',
    lc: '219',
    title: 'Contains Duplicate II',
    difficulty: 'Easy',
    pattern: 'Fixed',
    statement:
      'Return true if two distinct indices i and j have a[i] == a[j] and |i - j| ≤ K.',
    example: '[1,2,3,1], K=3 → true. Same with K=2 and no pair within 2 → false if the match is farther.',
    idea: 'Sliding HashSet of the last K values, or HashMap value → last index.',
    java: `boolean containsNearbyDuplicate(int[] a, int k) {
  Set<Integer> win = new HashSet<>();
  for (int i = 0; i < a.length; i++) {
    if (!win.add(a[i])) return true;
    if (win.size() > k) win.remove(a[i - k]);
  }
  return false;
}`,
    time: 'O(N)',
    space: 'O(K)',
    pitfalls: ['Using a global HashMap without checking distance. Set needs removal of a[i-k] not a random value.'],
    remember: 'A window of the last K values. Duplicate inside → true.',
  },
  {
    id: 'anagrams',
    lc: '438',
    title: 'Find All Anagrams in a String',
    difficulty: 'Medium',
    pattern: 'Fixed',
    statement:
      'Given s and p, return the start indices of all substrings of s that are anagrams of p. An anagram uses the same characters with the same frequencies.',
    example: 's = "cbaebabacd", p = "abc" → [0, 6] for "cba" and "bac".',
    idea: 'Fixed window of length p. Maintain a 26-count of need vs have. A match-counter of how many letters currently have the needed frequency.',
    java: `List<Integer> findAnagrams(String s, String p) {
  int[] need = new int[26], have = new int[26];
  for (char c : p.toCharArray()) need[c - 'a']++;
  List<Integer> ans = new ArrayList<>();
  int matches = 0, want = 0;
  for (int n : need) if (n > 0) want++;
  for (int r = 0; r < s.length(); r++) {
    int in = s.charAt(r) - 'a';
    have[in]++;
    if (have[in] == need[in]) matches++;
    if (r >= p.length()) {
      int out = s.charAt(r - p.length()) - 'a';
      if (have[out] == need[out]) matches--;
      have[out]--;
    }
    if (matches == want && r >= p.length() - 1) ans.add(r - p.length() + 1);
  }
  return ans;
}`,
    time: 'O(|s|)',
    space: 'O(1) alphabet',
    pitfalls: ['Sorting each window is O(N K log K). Compare 26-counts or a match integer instead.'],
    remember: 'Anagrams = same frequency vector. Slide a window of |p|.',
  },
  {
    id: 'perm-in-string',
    lc: '567',
    title: 'Permutation in String',
    difficulty: 'Medium',
    pattern: 'Fixed',
    statement:
      'Return true if s2 contains a permutation of s1 as a contiguous substring. Equivalent to: does s2 contain an anagram of s1?',
    example: 's1="ab", s2="eidbaooo" → true because "ba".',
    idea: 'Same as Find All Anagrams; stop at the first hit.',
    java: `boolean checkInclusion(String s1, String s2) {
  if (s1.length() > s2.length()) return false;
  int[] need = new int[26], have = new int[26];
  for (int i = 0; i < s1.length(); i++) {
    need[s1.charAt(i) - 'a']++;
    have[s2.charAt(i) - 'a']++;
  }
  if (Arrays.equals(need, have)) return true;
  for (int r = s1.length(); r < s2.length(); r++) {
    have[s2.charAt(r) - 'a']++;
    have[s2.charAt(r - s1.length()) - 'a']--;
    if (Arrays.equals(need, have)) return true;
  }
  return false;
}`,
    time: 'O(|s2|)',
    space: 'O(1)',
    pitfalls: ['Checking combinations/permutations recursively is exponential. This is a window, not backtracking.'],
    remember: 'Permutation of s1 = anagram window inside s2.',
  },
  {
    id: 'vowels-k',
    lc: '1456',
    title: 'Maximum Number of Vowels in a Substring of Given Length',
    difficulty: 'Medium',
    pattern: 'Fixed',
    statement:
      'Return the maximum number of vowels in any substring of s of length K. Vowels are a,e,i,o,u.',
    example: 's="abciiidef", K=3 → 3 from "iii".',
    idea: 'Fixed window; maintain a running vowel count.',
    java: `int maxVowels(String s, int k) {
  boolean[] v = new boolean[128];
  for (char c : "aeiou".toCharArray()) v[c] = true;
  int count = 0, best = 0;
  for (int i = 0; i < s.length(); i++) {
    if (v[s.charAt(i)]) count++;
    if (i >= k && v[s.charAt(i - k)]) count--;
    if (i >= k - 1) best = Math.max(best, count);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Y is not a vowel here. Count, do not rebuild the substring.'],
    remember: 'Fixed K + running vowel tally.',
  },
  {
    id: 'ones-iii',
    lc: '1004',
    title: 'Max Consecutive Ones III',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'Binary array and an integer K. You may flip at most K zeros to ones. Return the longest run of ones you can achieve.',
    example: '[1,1,1,0,0,0,1,1,1,1,0], K=2 → 6.',
    idea: 'Longest window that contains at most K zeros. Expand right; while zeros > K, advance left.',
    java: `int longestOnes(int[] a, int k) {
  int left = 0, zeros = 0, best = 0;
  for (int r = 0; r < a.length; r++) {
    if (a[r] == 0) zeros++;
    while (zeros > k) if (a[left++] == 0) zeros--;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['K=0 is just longest ones. Do not flip in the array; count zeros in the window.'],
    remember: 'At most K zeros in the window. That is the longest ones after flips.',
  },
  {
    id: 'longest-no-repeat',
    lc: '3',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'Given a string s, return the length of the longest substring that contains no repeating character.',
    example: '"abcabcbb" → 3 ("abc"). "bbbbb" → 1. "pwwkew" → 3 ("wke").',
    idea: 'Map char → last index. If s[right] was seen at ≥ left, jump left to last+1. Track max length.',
    java: `int lengthOfLongestSubstring(String s) {
  int[] last = new int[256];
  Arrays.fill(last, -1);
  int left = 0, best = 0;
  for (int r = 0; r < s.length(); r++) {
    char c = s.charAt(r);
    if (last[c] >= left) left = last[c] + 1;
    last[c] = r;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(alphabet)',
    pitfalls: ['Using a Set and shrinking one-by-one is also O(N). Forgetting to only jump if last index is still inside the window.'],
    remember: 'Window of unique chars. Repeat → move left past the previous copy.',
  },
  {
    id: 'k-distinct',
    lc: '340',
    title: 'Longest Substring with At Most K Distinct Characters',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'Return the length of the longest substring that contains at most K distinct characters.',
    example: 's="eceba", K=2 → 3 ("ece").',
    idea: 'HashMap counts. Expand right; while map.size() > K, decrement s[left] and maybe remove the key.',
    java: `int lengthAtMostK(String s, int k) {
  Map<Character, Integer> freq = new HashMap<>();
  int left = 0, best = 0;
  for (int r = 0; r < s.length(); r++) {
    freq.merge(s.charAt(r), 1, Integer::sum);
    while (freq.size() > k) {
      char c = s.charAt(left++);
      freq.put(c, freq.get(c) - 1);
      if (freq.get(c) == 0) freq.remove(c);
    }
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(K)',
    pitfalls: ['At most vs exactly K are different. Exactly K = atMost(K) − atMost(K−1).'],
    remember: 'Grow until K+1 distinct, then shrink. Longest window with ≤ K keys.',
  },
  {
    id: 'two-distinct',
    lc: '159',
    title: 'Longest Substring with At Most Two Distinct Characters',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'Special case of at most K distinct with K = 2. Return the longest substring that uses at most two different characters.',
    example: '"ccaabbb" → 5 ("aabbb").',
    idea: 'Same map as K-distinct with K=2. Interviewers use this as a warm-up for fruit baskets.',
    java: `int lengthOfLongestSubstringTwoDistinct(String s) {
  return lengthAtMostK(s, 2); // reuse the K-distinct function
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Writing a totally new algorithm — it is K=2.'],
    remember: 'Two distinct = fruit baskets = K-distinct with K=2.',
  },
  {
    id: 'fruit-baskets',
    lc: '904',
    title: 'Fruit Into Baskets',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'You walk along trees in a row. Each tree grows one fruit type. You have two baskets, each holding only one type, unlimited count. Starting at any tree, pick one fruit per tree going right, and you must stop when you would need a third type. Return the maximum number of fruits.',
    example: '[1,2,1,2,3] → 4 (first four trees). [0,1,2,2] → 3.',
    idea: 'Longest subarray with at most 2 distinct numbers. Same as LC 159.',
    java: `int totalFruit(int[] fruits) {
  Map<Integer, Integer> freq = new HashMap<>();
  int left = 0, best = 0;
  for (int r = 0; r < fruits.length; r++) {
    freq.merge(fruits[r], 1, Integer::sum);
    while (freq.size() > 2) {
      int x = fruits[left++];
      freq.put(x, freq.get(x) - 1);
      if (freq.get(x) == 0) freq.remove(x);
    }
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Misreading as "pick any trees". It is a contiguous subarray.'],
    remember: 'Two baskets = longest subarray with 2 distinct values.',
  },
  {
    id: 'char-replacement',
    lc: '424',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'You may replace at most K characters in s. Return the length of the longest substring that can be made into one repeating character.',
    example: 's="AABABBA", K=1 → 4 (replace the middle B in "AABA" or similar).',
    idea:
      'In a window, keep the count of the most frequent char. The rest of the window must be replaced. Valid while windowLen - maxFreq ≤ K. You can skip shrinking left one-by-one and only slide; max length never needs a smaller window once grown.',
    java: `int characterReplacement(String s, int k) {
  int[] f = new int[26];
  int left = 0, maxf = 0, best = 0;
  for (int r = 0; r < s.length(); r++) {
    maxf = Math.max(maxf, ++f[s.charAt(r) - 'A']);
    while (r - left + 1 - maxf > k) f[s.charAt(left++) - 'A']--;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Recomputing maxf by scanning 26 on shrink is fine. Thinking you must pick the letter first — the window discovers it.'],
    remember: 'Window − majority ≤ K replacements. Same family as Max Consecutive Ones III.',
  },
  {
    id: 'min-window',
    lc: '76',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    pattern: 'Variable shortest',
    statement:
      'Given s and t, return the shortest substring of s that covers every character of t (including duplicates). If none exists, return the empty string. If several have the same length, return the first.',
    example: 's="ADOBECODEBANC", t="ABC" → "BANC".',
    idea:
      'Need-map of t. Expand right until the window covers t (have==need). Then shrink left as far as it still covers, record best, and repeat.',
    java: `String minWindow(String s, String t) {
  int[] need = new int[128], have = new int[128];
  int want = 0;
  for (char c : t.toCharArray()) if (need[c]++ == 0) want++;
  int left = 0, got = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
  for (int r = 0; r < s.length(); r++) {
    char c = s.charAt(r);
    if (++have[c] == need[c]) got++;
    while (got == want) {
      if (r - left + 1 < bestLen) { bestLen = r - left + 1; bestL = left; }
      char o = s.charAt(left++);
      if (have[o]-- == need[o]) got--;
    }
  }
  return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}`,
    time: 'O(|s| + |t|)',
    space: 'O(alphabet)',
    pitfalls: ['Missing duplicate requirements in t. Returning any covering window, not the shortest. Two pointers must shrink after each valid window.'],
    remember: 'Cover t, then starve the left. Shortest covering window.',
  },
  {
    id: 'min-size-sum',
    lc: '209',
    title: 'Minimum Size Subarray Sum',
    difficulty: 'Medium',
    pattern: 'Variable shortest',
    statement:
      'Positive integers array and a target. Return the minimal length of a contiguous subarray whose sum is ≥ target, or 0 if none exists.',
    example: 'target=7, a=[2,3,1,2,4,3] → 2 ([4,3]).',
    idea: 'Because all values are positive, the sum is monotone: expand right, shrink left while sum ≥ target.',
    java: `int minSubArrayLen(int target, int[] a) {
  int left = 0, sum = 0, best = Integer.MAX_VALUE;
  for (int r = 0; r < a.length; r++) {
    sum += a[r];
    while (sum >= target) {
      best = Math.min(best, r - left + 1);
      sum -= a[left++];
    }
  }
  return best == Integer.MAX_VALUE ? 0 : best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Negatives break the while-shrink. Then you need prefix sums + monotonic queue or binary search.'],
    remember: 'Positive numbers → shrink while the sum is still big enough.',
  },
  {
    id: 'product-less-k',
    lc: '713',
    title: 'Subarray Product Less Than K',
    difficulty: 'Medium',
    pattern: 'At most / at least',
    statement:
      'Positive integers and an integer K. Count contiguous subarrays whose product is strictly less than K.',
    example: 'a=[10,5,2,6], K=100 → 8.',
    idea:
      'Expand right multiplying. While product ≥ K, divide by a[left]. Every window [left,right] contributes (right-left+1) valid subarrays ending at right.',
    java: `int numSubarrayProductLessThanK(int[] a, int k) {
  if (k <= 1) return 0;
  long prod = 1;
  int left = 0, ans = 0;
  for (int r = 0; r < a.length; r++) {
    prod *= a[r];
    while (prod >= k) prod /= a[left++];
    ans += r - left + 1;
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['K=0 or 1 → 0. Using int for product overflows. Counting windows, not just the longest.',
    ],
    remember: 'Valid windows ending at right = length of the current product<K window.',
  },
  {
    id: 'nice-subarrays',
    lc: '1248',
    title: 'Count Number of Nice Subarrays',
    difficulty: 'Medium',
    pattern: 'At most / at least',
    statement:
      'An array is nice if it contains exactly K odd numbers. Count contiguous nice subarrays.',
    example: '[1,1,2,1,1], K=3 → 2.',
    idea:
      'Map odds to 1 and evens to 0. Then it is "binary subarrays with sum K". Count atMost(K) − atMost(K−1).',
    java: `int numberOfSubarrays(int[] a, int k) {
  return atMost(a, k) - atMost(a, k - 1);
}

int atMost(int[] a, int k) {
  int left = 0, odds = 0, ans = 0;
  for (int r = 0; r < a.length; r++) {
    odds += a[r] & 1;
    while (odds > k) odds -= a[left++] & 1;
    ans += r - left + 1;
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Exactly K is not at most K. The subtraction trick is the whole point.'],
    remember: 'Exactly K = atMost(K) − atMost(K−1). Odds are the budget.',
  },
  {
    id: 'binary-sum',
    lc: '930',
    title: 'Binary Subarrays With Sum',
    difficulty: 'Medium',
    pattern: 'At most / at least',
    statement:
      'Binary array and goal. Count subarrays whose sum equals goal.',
    example: '[1,0,1,0,1], goal=2 → 4.',
    idea: 'Same atMost trick: atMost(goal) − atMost(goal−1). Prefix-sum HashMap also works.',
    java: `int numSubarraysWithSum(int[] a, int goal) {
  return atMost(a, goal) - (goal == 0 ? 0 : atMost(a, goal - 1));
}

int atMost(int[] a, int goal) {
  int left = 0, sum = 0, ans = 0;
  for (int r = 0; r < a.length; r++) {
    sum += a[r];
    while (left <= r && sum > goal) sum -= a[left++];
    ans += r - left + 1;
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['goal=0 needs a guard so atMost(-1) is not called, or treat goal==0 separately.'],
    remember: 'Binary sum = same window budget as nice subarrays.',
  },
  {
    id: 'k-different',
    lc: '992',
    title: 'Subarrays with K Different Integers',
    difficulty: 'Hard',
    pattern: 'At most / at least',
    statement:
      'Count subarrays that contain exactly K different integers.',
    example: '[1,2,1,2,3], K=2 → 7.',
    idea: 'atMost(K) − atMost(K−1) with a frequency map of distinct keys.',
    java: `int subarraysWithKDistinct(int[] a, int k) {
  return atMost(a, k) - atMost(a, k - 1);
}

int atMost(int[] a, int k) {
  Map<Integer, Integer> freq = new HashMap<>();
  int left = 0, ans = 0;
  for (int r = 0; r < a.length; r++) {
    freq.merge(a[r], 1, Integer::sum);
    while (freq.size() > k) {
      int x = a[left++];
      freq.put(x, freq.get(x) - 1);
      if (freq.get(x) == 0) freq.remove(x);
    }
    ans += r - left + 1;
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(K)',
    pitfalls: ['Trying to maintain exactly K in one pass with two left pointers is possible but harder to code under pressure.'],
    remember: 'Exactly K distinct = atMost(K) − atMost(K−1).',
  },
  {
    id: 'three-chars',
    lc: '1358',
    title: 'Number of Substrings Containing All Three Characters',
    difficulty: 'Medium',
    pattern: 'At most / at least',
    statement:
      'String of only a, b, c. Count substrings that contain at least one a, one b, and one c.',
    example: '"abcabc" → 10.',
    idea:
      'For each right, let left be the earliest index where [left,right] already has all three. Then every start ≤ left contributes. Or total substrings − atMost(2 distinct).',
    java: `int numberOfSubstrings(String s) {
  int[] last = {-1, -1, -1};
  int ans = 0;
  for (int r = 0; r < s.length(); r++) {
    last[s.charAt(r) - 'a'] = r;
    int start = Math.min(last[0], Math.min(last[1], last[2]));
    if (start >= 0) ans += start + 1;
  }
  return ans;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Counting only the shortest covering window. Every extension to the left of that window is also valid.'],
    remember: 'Once a,b,c are all seen, every prefix start before the oldest of the three last-seen indices works.',
  },
  {
    id: 'equal-budget',
    lc: '1208',
    title: 'Get Equal Substrings Within Budget',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      's and t of equal length. Changing s[i] to t[i] costs |s[i]-t[i]|. Return the longest substring you can convert from s to t with total cost ≤ maxCost.',
    example: 's="abcd", t="bcdf", maxCost=3 → 3.',
    idea: 'Cost array of n non-negative numbers. Longest subarray with sum ≤ maxCost.',
    java: `int equalSubstring(String s, String t, int maxCost) {
  int left = 0, cost = 0, best = 0;
  for (int r = 0; r < s.length(); r++) {
    cost += Math.abs(s.charAt(r) - t.charAt(r));
    while (cost > maxCost) {
      cost -= Math.abs(s.charAt(left) - t.charAt(left));
      left++;
    }
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Costs are always ≥ 0, so the shrink while is valid. Do not binary-search unless asked.'],
    remember: 'Abs diff is a positive cost. Longest subarray with sum ≤ budget.',
  },
  {
    id: 'freq-most',
    lc: '1838',
    title: 'Frequency of the Most Frequent Element',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'You may increment any element by 1, at most K times in total (one increment = one operation). After at most K operations, return the maximum possible frequency of any single value.',
    example: 'a=[1,2,4], K=5 → 3 (make all 4s).',
    idea:
      'Sort. Then a window [left,right] can all become a[right] if a[right]*(right-left+1) − sum(window) ≤ K.',
    java: `int maxFrequency(int[] a, int k) {
  Arrays.sort(a);
  long sum = 0;
  int left = 0, best = 1;
  for (int r = 0; r < a.length; r++) {
    sum += a[r];
    while ((long) a[r] * (r - left + 1) - sum > k) sum -= a[left++];
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N log N) from sort, then O(N)',
    space: 'O(1)',
    pitfalls: ['Must sort first. Long overflow on a[r] * length.',
    ],
    remember: 'Sort, then buy the rightmost value for the whole window with K increments.',
  },
  {
    id: 'max-answers',
    lc: '2024',
    title: 'Maximize the Confusion of an Exam',
    difficulty: 'Medium',
    pattern: 'Variable longest',
    statement:
      'A string of T and F. You may change at most K answers. Return the longest consecutive same-answer run you can create.',
    example: 'answerKey="TTFTTFTT", K=1 → 5.',
    idea: 'Longest window that is almost all T (at most K Fs) or almost all F (at most K Ts). Run the Ones-III helper twice.',
    java: `int maxConsecutiveAnswers(String s, int k) {
  return Math.max(longest(s, k, 'T'), longest(s, k, 'F'));
}

int longest(String s, int k, char major) {
  int left = 0, other = 0, best = 0;
  for (int r = 0; r < s.length(); r++) {
    if (s.charAt(r) != major) other++;
    while (other > k) if (s.charAt(left++) != major) other--;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['This is Max Consecutive Ones III on two alphabets, not a DP.'],
    remember: 'Longest T-run with ≤K flips, longest F-run with ≤K flips, take max.',
  },
  {
    id: 'cards-points',
    lc: '1423',
    title: 'Maximum Points You Can Obtain from Cards',
    difficulty: 'Medium',
    pattern: 'Fixed',
    statement:
      'Cards in a row with points. Take exactly K cards from the ends only (left or right, any mix). Return the maximum point sum.',
    example: '[1,2,3,4,5,6,1], K=3 → 12 (1+6+5 from ends).',
    idea:
      'You take i from the left and K−i from the right. Equivalent: total sum of the array minus the minimum subarray of length n−K (the leftover middle).',
    java: `int maxScore(int[] card, int k) {
  int n = card.length, sum = 0;
  for (int v : card) sum += v;
  int skip = n - k;
  if (skip == 0) return sum;
  int win = 0;
  for (int i = 0; i < skip; i++) win += card[i];
  int bestSkip = win;
  for (int r = skip; r < n; r++) {
    win += card[r] - card[r - skip];
    bestSkip = Math.min(bestSkip, win);
  }
  return sum - bestSkip;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Taking from ends is not a stack simulation. The leftover is a fixed-length middle window.'],
    remember: 'Max ends = total − min middle window of length n−K.',
  },
  {
    id: 'grumpy',
    lc: '1052',
    title: 'Grumpy Bookstore Owner',
    difficulty: 'Medium',
    pattern: 'Fixed',
    statement:
      'customers[i] people in minute i. grumpy[i]=1 means the owner is grumpy and those customers are unhappy. You can force not-grumpy for a window of X consecutive minutes. Return the maximum number of happy customers.',
    example: 'Use the X-minute secret technique on the window that saves the most currently-unhappy customers.',
    idea: 'Always-happy = customers where grumpy=0. Add the best extra = max sum of customers[i]*grumpy[i] over a window of X.',
    java: `int maxSatisfied(int[] customers, int[] grumpy, int x) {
  int base = 0, extra = 0, bestExtra = 0;
  for (int i = 0; i < customers.length; i++) {
    if (grumpy[i] == 0) base += customers[i];
    else extra += customers[i];
    if (i >= x && grumpy[i - x] == 1) extra -= customers[i - x];
    bestExtra = Math.max(bestExtra, extra);
  }
  return base + bestExtra;
}`,
    time: 'O(N)',
    space: 'O(1)',
    pitfalls: ['Do not add non-grumpy customers into the extra window — they are already in base.'],
    remember: 'Base happy + best X-minute rescue of grumpy minutes.',
  },
  {
    id: 'sw-median',
    lc: '480',
    title: 'Sliding Window Median',
    difficulty: 'Hard',
    pattern: 'Deque',
    statement:
      'Return the median of every contiguous window of size K. For even K, use the average of the two central values (as a double).',
    example: '[1,3,-1,-3,5,3,6,7], K=3 → [1,-1,-1,3,5,6].',
    idea:
      'Two heaps (max-heap low, min-heap high) plus lazy deletion of indices that left the window, or a TreeMap of values. Rebalance after each insert/remove.',
    java: `// Interview sketch: two heaps + delayed deletions.
// Insert nums[i] into low/high so that
//   low.size() == high.size() or low.size() == high.size()+1
// Median = K odd ? low.peek() : (low.peek()+high.peek())/2.0
// When i >= K, delayed-delete nums[i-K].
// Full Java is long; say "I keep two balanced heaps with lazy delete".`,
    time: 'O(N log K)',
    space: 'O(K)',
    pitfalls: ['Recomputing sort of each window is O(N K log K). Median ≠ mean. Even K needs two middles.'],
    remember: 'Window median = two heaps + lazy delete, not a decreasing deque (that is window max).',
  },
];
