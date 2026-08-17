import type {StreamCategory, StreamProblem} from './types';
import {PROBLEMS_CORE} from './problems-core';
import {PROBLEMS_COLLECTORS} from './problems-collectors';
import {PROBLEMS_DOMAIN} from './problems-domain';
import {PROBLEMS_ADVANCED} from './problems-advanced';
import {PROBLEMS_API_MATRIX} from './problems-api-matrix';
import {PROBLEMS_FLAVOURS} from './problems-flavours';

export type ProblemGroup = {
  id: StreamCategory | 'all';
  title: string;
  lead: string;
  problems: StreamProblem[];
};

export const ALL_PROBLEMS: StreamProblem[] = [
  ...PROBLEMS_CORE,
  ...PROBLEMS_COLLECTORS,
  ...PROBLEMS_DOMAIN,
  ...PROBLEMS_ADVANCED,
  ...PROBLEMS_API_MATRIX,
  ...PROBLEMS_FLAVOURS,
];

const byCat = (c: StreamCategory) => ALL_PROBLEMS.filter((p) => p.category === c);

export const PROBLEM_GROUPS: ProblemGroup[] = [
  {id:'fundamentals', title:'Fundamentals', lead:'Complete Stream sources: of/empty/builder/concat, iterate/generate, Collection/Arrays/Files, IntStream ranges.', problems: byCat('fundamentals')},
  {id:'filter', title:'Filter · predicates', lead:'All filter flavours: Predicate.and/or/negate, composition, null-safe selection.', problems: byCat('filter')},
  {id:'map', title:'Map', lead:'map, mapToInt/Long/Double, boxed, mapMulti — every 1:1 transform flavour.', problems: byCat('map')},
  {id:'flatmap', title:'FlatMap', lead:'flatMap, flatMapTo*, Optional.stream, mapMulti — 1:many flattening matrix.', problems: byCat('flatmap')},
  {id:'distinct', title:'Distinct', lead:'equals/hashCode distinct, distinct-by-key, stateful cost, encounter order.', problems: byCat('distinct')},
  {id:'sort', title:'Sorting', lead:'sorted(), Comparator chains, nullsFirst/Last, reverseOrder, stability.', problems: byCat('sort')},
  {id:'limit-skip', title:'Limit · Skip · Top-N', lead:'limit, skip, takeWhile, dropWhile — windows and short-circuit costs.', problems: byCat('limit-skip')},
  {id:'find-match', title:'Find · Match', lead:'any/all/noneMatch, findFirst/findAny, vacuous truth, parallel semantics.', problems: byCat('find-match')},
  {id:'reduce', title:'Reduce', lead:'1/2/3-arg reduce, identity/combiner, vs collect — all fold flavours.', problems: byCat('reduce')},
  {id:'collectors', title:'Collectors', lead:'toList/toSet/toCollection, summing/averaging/summarizing, collectingAndThen, teeing overview.', problems: byCat('collectors')},
  {id:'grouping', title:'GroupingBy', lead:'Complete JDK coverage: all groupingBy / groupingByConcurrent overloads, downstream collectors, map factories, and edge cases (g01–g35).', problems: byCat('grouping')},
  {id:'partitioning', title:'PartitioningBy', lead:'partitioningBy 1/2-arg, always both keys, downstream, vs groupingBy(Boolean).', problems: byCat('partitioning')},
  {id:'tomap-joining', title:'toMap · joining', lead:'toMap 2/3/4-arg, merge, mapFactory, toUnmodifiableMap; joining 1/2/3-arg.', problems: byCat('tomap-joining')},
  {id:'topn-nth', title:'Max · Min · Nth', lead:'max/min, sorted+skip, PriorityQueue alternatives, distinct vs non-distinct Nth.', problems: byCat('topn-nth')},
  {id:'duplicates-freq', title:'Duplicates · Frequency', lead:'Frequency maps, duplicate detection, LinkedHashMap first-unique patterns.', problems: byCat('duplicates-freq')},
  {id:'strings', title:'String streams', lead:'Chars, words, anagrams, first unique.', problems: byCat('strings')},
  {id:'arrays-lists', title:'Arrays · Two lists', lead:'Set ops, Arrays.stream traps, zip/intersect patterns.', problems: byCat('arrays-lists')},
  {id:'maps', title:'Map streams', lead:'entrySet streams, sort/filter/transform maps, invert.', problems: byCat('maps')},
  {id:'employee', title:'Employee suite', lead:'Classic interview employee aggregations.', problems: byCat('employee')},
  {id:'ecommerce', title:'E-commerce', lead:'Customer → Order → Item flatMaps.', problems: byCat('ecommerce')},
  {id:'fintech', title:'FinTech / payments', lead:'Transactions, FX, success rates.', problems: byCat('fintech')},
  {id:'datetime-optional', title:'DateTime · Optional', lead:'Windows, Optional.stream, temporal classifiers.', problems: byCat('datetime-optional')},
  {id:'parallel', title:'Parallel · traps', lead:'parallel/sequential/unordered, commonPool, when NOT to parallelize.', problems: byCat('parallel')},
  {id:'advanced-collectors', title:'Custom · teeing · andThen', lead:'Collector.of, characteristics, teeing, collectingAndThen deep.', problems: byCat('advanced-collectors')},
  {id:'production', title:'Production · JPA · files', lead:'Scale, DB, resource management.', problems: byCat('production')},
  {id:'api-coverage', title:'API coverage matrix programs', lead:'Less-common Stream / primitive / Collector APIs — systematic coverage.', problems: byCat('api-coverage')},
];

export const PROBLEM_COUNT = ALL_PROBLEMS.length;
