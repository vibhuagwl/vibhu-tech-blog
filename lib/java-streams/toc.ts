import type {TocItem} from './types';

export const STREAMS_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview · how seniors use Streams'},
  {id: 'api-checklist', label: '00b. API coverage checklist'},
  {id: 'fundamentals', label: '01. Fundamentals'},
  {id: 'filter', label: '02. Filter · predicates'},
  {id: 'map', label: '03. Map'},
  {id: 'flatmap', label: '04. FlatMap'},
  {id: 'distinct', label: '05. Distinct'},
  {id: 'sort', label: '06. Sorting'},
  {id: 'limit-skip', label: '07. Limit · Skip · Top-N'},
  {id: 'find-match', label: '08. Find · Match'},
  {id: 'reduce', label: '09. Reduce'},
  {id: 'collectors', label: '10. Collectors catalog'},
  {id: 'grouping', label: '11. GroupingBy'},
  {id: 'partitioning', label: '12. PartitioningBy'},
  {id: 'tomap-joining', label: '13. toMap · joining'},
  {id: 'topn-nth', label: '14. Max · Min · Nth'},
  {id: 'duplicates-freq', label: '15. Duplicates · Frequency'},
  {id: 'strings', label: '16. String streams'},
  {id: 'arrays-lists', label: '17. Arrays · Two lists'},
  {id: 'maps', label: '18. Map streams'},
  {id: 'employee', label: '19. Employee suite'},
  {id: 'ecommerce', label: '20. E-commerce'},
  {id: 'fintech', label: '21. FinTech / payments'},
  {id: 'datetime-optional', label: '22. DateTime · Optional'},
  {id: 'parallel', label: '23. Parallel · traps'},
  {id: 'advanced-collectors', label: '24. Custom · teeing · andThen'},
  {id: 'production', label: '25. Production · JPA · files'},
  {id: 'internals', label: '26. Internals · Spliterator'},
  {id: 'performance', label: '27. Performance · Streams vs loops'},
  {id: 'bad-code', label: '28. Clever-but-bad code'},
  {id: 'coding-round', label: '29. Coding-round set'},
  {id: 'prediction', label: '30. Output prediction'},
  {id: 'debugging', label: '31. Debugging broken pipelines'},
  {id: 'architect-q', label: '32. Architect questions'},
  {id: 'java-versions', label: '33. Java 8 → 21+'},
  {id: 'levels', label: '34. What interviewers expect'},
  {id: 'top100', label: '35. Top 100 must-know'},
  {id: 'cheat', label: '36. Cheat sheet'},
  {id: 'interview', label: '37. Interview bank'},
  {id: 'lab', label: '38. Runnable lab'},
  {id: 'api-coverage', label: '39. API matrix programs'},
];

export const MEMORY_SENTENCE =
  'Identify operation → collector → data structure → complexity → edge cases → parallel? → is Stream appropriate? → would SQL win? → production scale.';

export const VERSION_NOTE =
  'Java 8 Streams baseline · Java 9 takeWhile/dropWhile/ofNullable · Java 16 Stream.toList() · Java 21 records + virtual threads (not a Stream feature). Prefer Java 21 style in solutions.';
