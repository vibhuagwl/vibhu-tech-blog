import type {DlqCornerCase} from './corner-types';
import {CORNER_CASES_A} from './corner-cases-a';
import {CORNER_CASES_B} from './corner-cases-b';
import {CORNER_CASES_C} from './corner-cases-c';

export const DLQ_CORNER_CASES: DlqCornerCase[] = [
  ...CORNER_CASES_A,
  ...CORNER_CASES_B,
  ...CORNER_CASES_C,
];

export const CORNER_SUMMARY_ROWS: string[][] = DLQ_CORNER_CASES.map((c) => [
  c.title,
  c.classify,
  c.retry,
  c.dlq,
  c.holdCashLine ? 'Hold CL' : 'No hold',
  c.lab ?? '—',
]);
