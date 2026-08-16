import type {StreamCategory, StreamProblem} from './types';
import {PROBLEMS_CORE} from './problems-core';
import {PROBLEMS_COLLECTORS} from './problems-collectors';
import {PROBLEMS_DOMAIN} from './problems-domain';
import {PROBLEMS_ADVANCED} from './problems-advanced';
import {PROBLEMS_API_MATRIX} from './problems-api-matrix';

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
];

const byCat = (c: StreamCategory) => ALL_PROBLEMS.filter((p) => p.category === c);

export const PROBLEM_GROUPS: ProblemGroup[] = [
  {id:'fundamentals', title:'Fundamentals', lead:'Sources, primitives, iterate/generate, files.', problems: byCat('fundamentals')},
  {id:'filter', title:'Filter · predicates', lead:'Selection and Predicate composition.', problems: byCat('filter')},
  {id:'map', title:'Map', lead:'1:1 transforms and DTO projection.', problems: byCat('map')},
  {id:'flatmap', title:'FlatMap', lead:'1:many flattening and Optional.stream.', problems: byCat('flatmap')},
  {id:'distinct', title:'Distinct', lead:'equals/hashCode and distinct-by-key.', problems: byCat('distinct')},
  {id:'sort', title:'Sorting', lead:'Comparator chains and nulls.', problems: byCat('sort')},
  {id:'limit-skip', title:'Limit · Skip · Top-N', lead:'Windows and pagination costs.', problems: byCat('limit-skip')},
  {id:'find-match', title:'Find · Match', lead:'Short-circuit find/match.', problems: byCat('find-match')},
  {id:'reduce', title:'Reduce', lead:'Folds and parallel combiners.', problems: byCat('reduce')},
  {id:'collectors', title:'Collectors', lead:'Core Collectors API.', problems: byCat('collectors')},
  {id:'grouping', title:'GroupingBy', lead:'Nested grouping and downstream collectors.', problems: byCat('grouping')},
  {id:'partitioning', title:'PartitioningBy', lead:'Boolean partitions.', problems: byCat('partitioning')},
  {id:'tomap-joining', title:'toMap · joining', lead:'Maps and string joining.', problems: byCat('tomap-joining')},
  {id:'topn-nth', title:'Max · Min · Nth', lead:'Top-N and Nth highest pitfalls.', problems: byCat('topn-nth')},
  {id:'duplicates-freq', title:'Duplicates · Frequency', lead:'Counting and duplicate detection.', problems: byCat('duplicates-freq')},
  {id:'strings', title:'String streams', lead:'Chars, words, anagrams, first unique.', problems: byCat('strings')},
  {id:'arrays-lists', title:'Arrays · Two lists', lead:'Set ops and array streams.', problems: byCat('arrays-lists')},
  {id:'maps', title:'Map streams', lead:'Sort/filter/transform maps.', problems: byCat('maps')},
  {id:'employee', title:'Employee suite', lead:'Classic interview employee aggregations.', problems: byCat('employee')},
  {id:'ecommerce', title:'E-commerce', lead:'Customer → Order → Item flatMaps.', problems: byCat('ecommerce')},
  {id:'fintech', title:'FinTech / payments', lead:'Transactions, FX, success rates.', problems: byCat('fintech')},
  {id:'datetime-optional', title:'DateTime · Optional', lead:'Windows, Optional.stream.', problems: byCat('datetime-optional')},
  {id:'parallel', title:'Parallel · traps', lead:'When to parallelize — and when not.', problems: byCat('parallel')},
  {id:'advanced-collectors', title:'Custom · teeing · andThen', lead:'Advanced collectors.', problems: byCat('advanced-collectors')},
  {id:'production', title:'Production · JPA · files', lead:'Scale, DB, resource management.', problems: byCat('production')},
  {id:'api-coverage', title:'API coverage matrix programs', lead:'Less-common Stream / primitive / Collector APIs — systematic coverage.', problems: byCat('api-coverage')},
];

export const PROBLEM_COUNT = ALL_PROBLEMS.length;
