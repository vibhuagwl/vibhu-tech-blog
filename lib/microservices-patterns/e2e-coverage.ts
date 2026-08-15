import type {PatternCard} from './types';
import {ALL_PATTERNS} from './catalog';
import {needsDb, needsKafka, needsRedis} from './enrich';

type CoverageField =
  | 'javaCode'
  | 'springCode'
  | 'kafkaCode'
  | 'dbCode'
  | 'redisCode'
  | 'unitTest'
  | 'integrationTest'
  | 'failureTest'
  | 'concurrencyTest';

const MANDATORY_FIELDS: CoverageField[] = ['javaCode', 'unitTest', 'springCode', 'integrationTest', 'failureTest'];

function hasField(pattern: PatternCard, field: CoverageField): boolean {
  const value = pattern[field];
  return typeof value === 'string' && value.trim().length > 0;
}

function statusFor(pattern: PatternCard): string {
  const mandatoryOk = MANDATORY_FIELDS.every((f) => hasField(pattern, f));
  const kafkaOk = !needsKafka(pattern) || hasField(pattern, 'kafkaCode');
  const dbOk = !needsDb(pattern) || hasField(pattern, 'dbCode');
  const redisOk = !needsRedis(pattern) || hasField(pattern, 'redisCode');
  return mandatoryOk && kafkaOk && dbOk && redisOk ? 'OK' : 'GAP';
}

function flag(value: boolean): string {
  return value ? 'Y' : 'N';
}

export const E2E_COVERAGE_ROWS: string[][] = ALL_PATTERNS.map((p) => [
  p.id,
  flag(hasField(p, 'javaCode')),
  flag(hasField(p, 'springCode')),
  flag(hasField(p, 'kafkaCode')),
  flag(hasField(p, 'dbCode')),
  flag(hasField(p, 'redisCode')),
  flag(hasField(p, 'unitTest')),
  flag(hasField(p, 'integrationTest')),
  flag(hasField(p, 'failureTest')),
  flag(hasField(p, 'concurrencyTest')),
  statusFor(p),
]);

export const E2E_GAPS: string[] = ALL_PATTERNS.flatMap((p) => {
  const gaps: string[] = [];
  for (const field of MANDATORY_FIELDS) {
    if (!hasField(p, field)) {
      gaps.push(`${p.id}: missing ${field}`);
    }
  }
  if (needsKafka(p) && !hasField(p, 'kafkaCode')) {
    gaps.push(`${p.id}: missing kafkaCode (domain-relevant)`);
  }
  if (needsDb(p) && !hasField(p, 'dbCode')) {
    gaps.push(`${p.id}: missing dbCode (domain-relevant)`);
  }
  if (needsRedis(p) && !hasField(p, 'redisCode')) {
    gaps.push(`${p.id}: missing redisCode (domain-relevant)`);
  }
  return gaps;
});

export function assertFullCoverage(): void {
  if (E2E_GAPS.length > 0) {
    throw new Error(`E2E coverage gaps (${E2E_GAPS.length}):\n${E2E_GAPS.slice(0, 20).join('\n')}`);
  }
}
