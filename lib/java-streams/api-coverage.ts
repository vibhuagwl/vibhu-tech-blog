/**
 * Java Stream API Coverage Checklist — marks every important API with
 * program / edge-case / interview / performance coverage for Staff+ prep.
 *
 * Legend:
 *   program     — dedicated catalog problem exists
 *   edgeCase    — edge/trap called out (empty, unordered, duplicate keys, …)
 *   interview   — appears in interview bank, coding round, prediction, or debug
 *   performance — complexity / parallel / boxing / resource note present
 */

export type CoverageFlags = {
  program: boolean;
  edgeCase: boolean;
  interview: boolean;
  performance: boolean;
};

export type ApiGroup =
  | 'Stream sources & factories'
  | 'Stream intermediate'
  | 'Stream terminal & mode'
  | 'IntStream / LongStream / DoubleStream'
  | 'Collectors'
  | 'Internals & parallel';

export type ApiCoverageRow = {
  api: string;
  group: ApiGroup;
  since: string;
  problemIds: string[];
  flags: CoverageFlags;
  notes?: string;
};

const yes = (partial?: Partial<CoverageFlags>): CoverageFlags => ({
  program: true,
  edgeCase: true,
  interview: true,
  performance: true,
  ...partial,
});

export const API_COVERAGE: ApiCoverageRow[] = [
  // —— Stream sources ——
  {api: 'Stream.of()', group: 'Stream sources & factories', since: '8', problemIds: ['api01'], flags: yes({interview: true}), notes: 'Varargs vs array pitfall'},
  {api: 'Stream.empty()', group: 'Stream sources & factories', since: '8', problemIds: ['api02'], flags: yes(), notes: 'Vacuous match semantics'},
  {api: 'Stream.builder()', group: 'Stream sources & factories', since: '8', problemIds: ['api03'], flags: yes({performance: false}), notes: 'Rare; ArrayList usually clearer'},
  {api: 'Stream.concat()', group: 'Stream sources & factories', since: '8', problemIds: ['api04'], flags: yes(), notes: 'Prefer flatMap for N streams'},
  {api: 'Stream.iterate()', group: 'Stream sources & factories', since: '8/9', problemIds: ['api05', 'f05'], flags: yes(), notes: '3-arg iterate Java 9'},
  {api: 'Stream.generate()', group: 'Stream sources & factories', since: '8', problemIds: ['api06'], flags: yes(), notes: 'Must bound with limit'},
  {api: 'Stream.ofNullable()', group: 'Stream sources & factories', since: '9', problemIds: ['api07'], flags: yes()},
  {api: 'Collection.stream()', group: 'Stream sources & factories', since: '8', problemIds: ['f01'], flags: yes()},
  {api: 'Collection.parallelStream()', group: 'Stream sources & factories', since: '8', problemIds: ['api15', 'pr01'], flags: yes()},
  {api: 'Arrays.stream()', group: 'Stream sources & factories', since: '8', problemIds: ['f04'], flags: yes()},
  {api: 'Files.lines()', group: 'Stream sources & factories', since: '8', problemIds: ['api17'], flags: yes(), notes: 'AutoCloseable'},
  {api: 'Optional.stream()', group: 'Stream sources & factories', since: '9', problemIds: ['fm05'], flags: yes({performance: false})},

  // —— Intermediate ——
  {api: 'filter()', group: 'Stream intermediate', since: '8', problemIds: ['fi01'], flags: yes()},
  {api: 'map()', group: 'Stream intermediate', since: '8', problemIds: ['m01'], flags: yes()},
  {api: 'flatMap()', group: 'Stream intermediate', since: '8', problemIds: ['fm01'], flags: yes()},
  {api: 'mapMulti()', group: 'Stream intermediate', since: '16', problemIds: ['api10'], flags: yes()},
  {api: 'distinct()', group: 'Stream intermediate', since: '8', problemIds: ['d01'], flags: yes()},
  {api: 'sorted()', group: 'Stream intermediate', since: '8', problemIds: ['so01'], flags: yes()},
  {api: 'peek()', group: 'Stream intermediate', since: '8', problemIds: [], flags: yes({program: false}), notes: 'Covered in bad-code + prediction — debug only'},
  {api: 'limit()', group: 'Stream intermediate', since: '8', problemIds: ['ls01'], flags: yes()},
  {api: 'skip()', group: 'Stream intermediate', since: '8', problemIds: ['ls02'], flags: yes()},
  {api: 'takeWhile()', group: 'Stream intermediate', since: '9', problemIds: ['api08'], flags: yes()},
  {api: 'dropWhile()', group: 'Stream intermediate', since: '9', problemIds: ['api09'], flags: yes()},
  {api: 'mapToInt/Long/Double()', group: 'Stream intermediate', since: '8', problemIds: ['api21'], flags: yes()},
  {api: 'flatMapToInt/Long/Double()', group: 'Stream intermediate', since: '8', problemIds: ['api22'], flags: yes()},

  // —— Terminal & mode ——
  {api: 'forEach() / forEachOrdered()', group: 'Stream terminal & mode', since: '8', problemIds: ['f01'], flags: yes()},
  {api: 'toArray()', group: 'Stream terminal & mode', since: '8', problemIds: ['api12'], flags: yes()},
  {api: 'reduce()', group: 'Stream terminal & mode', since: '8', problemIds: ['api27', 'r01'], flags: yes()},
  {api: 'collect()', group: 'Stream terminal & mode', since: '8', problemIds: ['c01'], flags: yes()},
  {api: 'Stream.toList()', group: 'Stream terminal & mode', since: '16', problemIds: ['api11'], flags: yes()},
  {api: 'min() / max()', group: 'Stream terminal & mode', since: '8', problemIds: ['tn01'], flags: yes()},
  {api: 'count()', group: 'Stream terminal & mode', since: '8', problemIds: ['api02'], flags: yes()},
  {api: 'anyMatch/allMatch/noneMatch()', group: 'Stream terminal & mode', since: '8', problemIds: ['fmch01'], flags: yes()},
  {api: 'findFirst() / findAny()', group: 'Stream terminal & mode', since: '8', problemIds: ['fmch02'], flags: yes()},
  {api: 'iterator()', group: 'Stream terminal & mode', since: '8', problemIds: ['api13'], flags: yes({performance: false})},
  {api: 'spliterator()', group: 'Stream terminal & mode', since: '8', problemIds: ['api14'], flags: yes()},
  {api: 'isParallel()', group: 'Stream terminal & mode', since: '8', problemIds: ['api15'], flags: yes()},
  {api: 'sequential()', group: 'Stream terminal & mode', since: '8', problemIds: ['api15'], flags: yes()},
  {api: 'parallel()', group: 'Stream terminal & mode', since: '8', problemIds: ['api15'], flags: yes()},
  {api: 'unordered()', group: 'Stream terminal & mode', since: '8', problemIds: ['api16'], flags: yes()},
  {api: 'onClose() / close()', group: 'Stream terminal & mode', since: '8', problemIds: ['api17'], flags: yes()},

  // —— Primitive streams ——
  {api: 'IntStream.range()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api18'], flags: yes()},
  {api: 'IntStream.rangeClosed()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api18'], flags: yes()},
  {api: 'LongStream.rangeClosed()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api29'], flags: yes()},
  {api: 'DoubleStream.of()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api19', 'api29'], flags: yes()},
  {api: 'sum()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api18', 'api29'], flags: yes()},
  {api: 'average()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api21', 'api29'], flags: yes()},
  {api: 'summaryStatistics()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api19'], flags: yes()},
  {api: 'min() / max() / count()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api19'], flags: yes()},
  {api: 'boxed()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api20'], flags: yes()},
  {api: 'mapToObj()', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api20'], flags: yes()},
  {api: 'map / flatMap (primitive)', group: 'IntStream / LongStream / DoubleStream', since: '8', problemIds: ['api22'], flags: yes()},

  // —— Collectors ——
  {api: 'Collectors.toList()', group: 'Collectors', since: '8', problemIds: ['api11', 'c01'], flags: yes()},
  {api: 'Collectors.toSet()', group: 'Collectors', since: '8', problemIds: ['c01'], flags: yes()},
  {api: 'Collectors.joining()', group: 'Collectors', since: '8', problemIds: ['tj01', 'g21'], flags: yes()},
  {api: 'Collectors.counting()', group: 'Collectors', since: '8', problemIds: ['g01', 'g02'], flags: yes()},
  {api: 'Collectors.summarizingInt()', group: 'Collectors', since: '8', problemIds: ['c02', 'g17'], flags: yes()},
  {api: 'Collectors.summarizingLong()', group: 'Collectors', since: '8', problemIds: ['api24', 'g18'], flags: yes()},
  {api: 'Collectors.summarizingDouble()', group: 'Collectors', since: '8', problemIds: ['api24', 'g18'], flags: yes()},
  {api: 'Collectors.summingInt/Long/Double()', group: 'Collectors', since: '8', problemIds: ['c03', 'g03'], flags: yes()},
  {api: 'Collectors.averagingInt/Long/Double()', group: 'Collectors', since: '8', problemIds: ['c04', 'g05'], flags: yes()},
  {api: 'Collectors.toCollection()', group: 'Collectors', since: '8', problemIds: ['api30', 'c01', 'g29'], flags: yes()},
  {api: 'Collectors.toMap()', group: 'Collectors', since: '8', problemIds: ['tj02', 'g33'], flags: yes()},
  {api: 'Collectors.toUnmodifiableList()', group: 'Collectors', since: '10', problemIds: ['api23'], flags: yes()},
  {api: 'Collectors.toUnmodifiableSet()', group: 'Collectors', since: '10', problemIds: ['api23'], flags: yes()},
  {api: 'Collectors.toUnmodifiableMap()', group: 'Collectors', since: '10', problemIds: ['api23'], flags: yes()},
  {api: 'Collectors.groupingBy()', group: 'Collectors', since: '8', problemIds: ['g01', 'g16'], flags: yes()},
  {api: 'Collectors.groupingByConcurrent()', group: 'Collectors', since: '8', problemIds: ['g09', 'g23', 'g24', 'g35', 'pr02'], flags: yes()},
  {api: 'Collectors.partitioningBy()', group: 'Collectors', since: '8', problemIds: ['p01', 'g22'], flags: yes()},
  {api: 'Collectors.mapping()', group: 'Collectors', since: '8', problemIds: ['g03', 'g06', 'g21'], flags: yes()},
  {api: 'Collectors.filtering()', group: 'Collectors', since: '9', problemIds: ['g10', 'api30'], flags: yes()},
  {api: 'Collectors.flatMapping()', group: 'Collectors', since: '9', problemIds: ['g15', 'api30'], flags: yes()},
  {api: 'Collectors.collectingAndThen()', group: 'Collectors', since: '8', problemIds: ['ac01', 'g07', 'g19', 'g32'], flags: yes()},
  {api: 'Collectors.minBy() / maxBy()', group: 'Collectors', since: '8', problemIds: ['g07', 'g19'], flags: yes()},
  {api: 'Collectors.reducing()', group: 'Collectors', since: '8', problemIds: ['api25', 'g20', 'g30'], flags: yes()},
  {api: 'Collectors.teeing()', group: 'Collectors', since: '12', problemIds: ['ac02', 'g11'], flags: yes()},

  // —— Internals ——
  {api: 'Spliterator', group: 'Internals & parallel', since: '8', problemIds: ['api14', 'api28'], flags: yes()},
  {api: 'tryAdvance() / trySplit()', group: 'Internals & parallel', since: '8', problemIds: ['api28'], flags: yes()},
  {api: 'Spliterator characteristics', group: 'Internals & parallel', since: '8', problemIds: ['api14', 'api28'], flags: yes()},
  {api: 'Pipeline / Sink / lazy eval', group: 'Internals & parallel', since: '8', problemIds: [], flags: yes({program: false}), notes: 'Concepts + prediction bank'},
  {api: 'Short-circuiting', group: 'Internals & parallel', since: '8', problemIds: ['api08'], flags: yes()},
  {api: 'Stateful vs stateless ops', group: 'Internals & parallel', since: '8', problemIds: ['api16'], flags: yes()},
  {api: 'ForkJoinPool.commonPool()', group: 'Internals & parallel', since: '8', problemIds: ['api15'], flags: yes()},
  {api: 'reduce associativity', group: 'Internals & parallel', since: '8', problemIds: ['api27'], flags: yes()},
  {api: 'Collector.Characteristics CONCURRENT', group: 'Internals & parallel', since: '8', problemIds: ['api26'], flags: yes()},
  {api: 'Collector.Characteristics UNORDERED', group: 'Internals & parallel', since: '8', problemIds: ['api26'], flags: yes()},
  {api: 'Collector.Characteristics IDENTITY_FINISH', group: 'Internals & parallel', since: '8', problemIds: ['api26'], flags: yes()},
];

export const API_COVERAGE_GROUPS: ApiGroup[] = [
  'Stream sources & factories',
  'Stream intermediate',
  'Stream terminal & mode',
  'IntStream / LongStream / DoubleStream',
  'Collectors',
  'Internals & parallel',
];

export function coverageScore(row: ApiCoverageRow): number {
  const f = row.flags;
  return [f.program, f.edgeCase, f.interview, f.performance].filter(Boolean).length;
}

export function coverageSummary(rows: ApiCoverageRow[] = API_COVERAGE) {
  const total = rows.length;
  const full = rows.filter((r) => coverageScore(r) === 4).length;
  const withProgram = rows.filter((r) => r.flags.program).length;
  return {total, full, withProgram, pctFull: Math.round((full / total) * 100)};
}

export const COVERAGE_LEGEND = `✅ Covered with program
✅ Covered with edge case
✅ Covered with interview question
✅ Covered with performance analysis

Goal: every public Stream / primitive / Collector API used in senior interviews is systematically marked — not just "lots of programs."`;
