import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {
    id: 's1',
    topic: 'Why',
    question: 'Why override both equals and hashCode for HashMap keys?',
    answer30s:
      'hashCode picks the bucket; equals finds the entry in that bucket. Missing either breaks put/get for logical duplicates.',
    answer2m:
      'Without hashCode, equal logical keys land in different buckets so equals is never consulted. Without equals, same-bucket keys never replace each other. Override both consistently with the Object contract.',
    followUps: ['What if only equals?', 'What if only hashCode?'],
  },
  {
    id: 's2',
    topic: 'Contract',
    question: 'If equals returns true, must hashCodes be equal?',
    answer30s: 'Yes — required by the Object contract.',
    answer2m:
      'Hash-based collections assume this. Violating it makes maps silently fail: equal keys never meet in the same bucket.',
    followUps: ['Can unequal objects share a hashCode?'],
    trick: '“No, hashCode is optional.”',
  },
  {
    id: 's3',
    topic: 'Collision',
    question: 'Same hashCode — are objects always equal?',
    answer30s: 'No. Collisions are normal; equals resolves them.',
    answer2m:
      'Many keys can hash to one bucket. HashMap walks the chain (or treeifies) and calls equals on each candidate.',
    followUps: ['What is treeification?'],
  },
  {
    id: 's4',
    topic: 'Combo',
    question: 'hashCode always 1, equals always true — HashMap size after put a,b,a?',
    answer30s: 'Size 1. Every put replaces the single entry.',
    answer2m:
      'One bucket, every key equals every other. Last value wins. Terrible distribution — interview trap, never ship.',
    followUps: ['What does TreeMap do with the same key class if Comparable by name?'],
  },
  {
    id: 's5',
    topic: 'Combo',
    question: 'Correct equals, default hashCode — can HashMap get() work?',
    answer30s: 'Usually no. Different identity hashes → different buckets → equals never runs.',
    answer2m:
      'Verified pattern: size stays 3 after put a,b,a; get(new a) returns null. You must override hashCode too.',
    followUps: ['Does ConcurrentHashMap behave differently?'],
  },
  {
    id: 's6',
    topic: 'LinkedHashMap',
    question: 'Does LinkedHashMap change equals/hashCode rules?',
    answer30s: 'No. Same contract as HashMap. Extra: preserves order.',
    answer2m:
      'Broken equals/hashCode produces the same size/get failures. Linked list only affects iteration / LRU access-order mode.',
    followUps: ['accessOrder=true meaning?'],
  },
  {
    id: 's7',
    topic: 'CHM',
    question: 'ConcurrentHashMap vs HashMap for custom keys?',
    answer30s: 'Same equals/hashCode rules. No null keys/values. Concurrent structure.',
    answer2m:
      'Empirically identical size/get outcomes for the classic combo experiments. Do not use null keys. Prefer immutable keys under concurrency.',
    followUps: ['Why no null key?'],
  },
  {
    id: 's8',
    topic: 'TreeMap',
    question: 'Does TreeMap use hashCode?',
    answer30s: 'Not for placement. It uses Comparable/Comparator.',
    answer2m:
      'With compareTo by name, put a,b,a yields size 2 and successful get even when equals/hashCode are broken — because compareTo(0) defines sameness. Keep compareTo consistent with equals.',
    followUps: ['What if key is not Comparable and no Comparator?'],
    trick: '“TreeMap still hashes into red-black buckets.”',
  },
  {
    id: 's9',
    topic: 'instanceof',
    question: 'instanceof vs getClass() in equals?',
    answer30s: 'instanceof allows subclasses; getClass requires exact class.',
    answer2m:
      'getClass is stricter and safer for final domain keys. instanceof can break symmetry with subclasses that add fields.',
    followUps: ['What about records?'],
  },
  {
    id: 's10',
    topic: 'Mutable',
    question: 'Why are mutable HashMap keys dangerous?',
    answer30s: 'Mutating a field used in hashCode/equals after put loses the entry.',
    answer2m:
      'Key hashes to bucket A; you change the field; get looks in bucket B. Entry still exists but is unreachable. Use immutable keys.',
    followUps: ['Can ConcurrentHashMap save you?'],
  },
];

export const ARCHITECT: InterviewQ[] = [
  {
    id: 'a1',
    topic: 'Design',
    question: 'Design a payment account key for ConcurrentHashMap caches across pods.',
    answer30s: 'Immutable value object / record with id fields; equals+hashCode on business id; never mutate.',
    answer2m:
      'Prefer String/UUID/record. Document that in-process CHM is not a distributed cache. For multi-JVM use Redis with the same logical key encoding.',
    followUps: ['Nullability?', 'Serialization?'],
  },
  {
    id: 'a2',
    topic: 'TreeMap',
    question: 'When would you choose TreeMap over HashMap for keys?',
    answer30s: 'When you need sorted keys, range queries, or floor/ceiling navigation.',
    answer2m:
      'Pay O(log n). Define total order consistent with equals. For concurrent sorted maps use ConcurrentSkipListMap. Do not rely on hashCode.',
    followUps: ['SortedMap views?'],
  },
  {
    id: 'a3',
    topic: 'Consistency',
    question: 'compareTo returns 0 but equals returns false — what breaks?',
    answer30s: 'TreeMap treats them as the same key; SortedSet contracts break; subtle data loss.',
    answer2m:
      'Java docs require consistency: compareTo==0 iff equals. Violations cause missing entries and broken Set semantics.',
    followUps: ['Example with BigDecimal?'],
  },
];

export const RAPID: InterviewQ[] = [
  {id: 'r1', topic: 'Rapid', question: 'equals true ⇒ same hashCode?', answer30s: 'Yes (contract).', answer2m: 'Required for HashMap correctness.', followUps: []},
  {id: 'r2', topic: 'Rapid', question: 'Same hashCode ⇒ equals true?', answer30s: 'No.', answer2m: 'Collisions are allowed.', followUps: []},
  {id: 'r3', topic: 'Rapid', question: 'HashMap neither overridden — size after a,b,a?', answer30s: '3', answer2m: 'get returns null.', followUps: []},
  {id: 'r4', topic: 'Rapid', question: 'Both correct — size?', answer30s: '2', answer2m: 'get returns overridden value.', followUps: []},
  {id: 'r5', topic: 'Rapid', question: 'TreeMap uses hashCode?', answer30s: 'No for structure.', answer2m: 'Comparable/Comparator.', followUps: []},
  {id: 'r6', topic: 'Rapid', question: 'LinkedHashMap equality rules?', answer30s: 'Same as HashMap.', answer2m: 'Plus order.', followUps: []},
  {id: 'r7', topic: 'Rapid', question: 'CHM null key?', answer30s: 'Forbidden.', answer2m: 'NPE.', followUps: []},
  {id: 'r8', topic: 'Rapid', question: 'Prefer key types?', answer30s: 'String, wrappers, records.', answer2m: 'Already implement contract.', followUps: []},
];

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
