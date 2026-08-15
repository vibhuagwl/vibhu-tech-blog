import {ALL_PATTERNS} from '../lib/microservices-patterns/catalog';
import {E2E_COVERAGE_ROWS, E2E_GAPS, assertFullCoverage} from '../lib/microservices-patterns/e2e-coverage';
import {
  needsConfig,
  needsDb,
  needsKafka,
  needsRedis,
  needsRestApi,
  needsConcurrency,
} from '../lib/microservices-patterns/enrich';

const fields = [
  'springCode',
  'config',
  'restApi',
  'kafkaCode',
  'dbCode',
  'redisCode',
  'integrationTest',
  'failureTest',
  'concurrencyTest',
] as const;

const counts: Record<string, number> = {
  total: ALL_PATTERNS.length,
  javaCode: ALL_PATTERNS.filter((p) => p.javaCode?.trim()).length,
  unitTest: ALL_PATTERNS.filter((p) => p.unitTest?.trim()).length,
};

for (const field of fields) {
  counts[field] = ALL_PATTERNS.filter((p) => p[field]?.trim()).length;
}

const domainCounts = {
  kafkaRelevant: ALL_PATTERNS.filter(needsKafka).length,
  kafkaFilled: ALL_PATTERNS.filter((p) => needsKafka(p) && p.kafkaCode?.trim()).length,
  dbRelevant: ALL_PATTERNS.filter(needsDb).length,
  dbFilled: ALL_PATTERNS.filter((p) => needsDb(p) && p.dbCode?.trim()).length,
  redisRelevant: ALL_PATTERNS.filter(needsRedis).length,
  redisFilled: ALL_PATTERNS.filter((p) => needsRedis(p) && p.redisCode?.trim()).length,
  configRelevant: ALL_PATTERNS.filter(needsConfig).length,
  configFilled: ALL_PATTERNS.filter((p) => needsConfig(p) && p.config?.trim()).length,
  restApiRelevant: ALL_PATTERNS.filter(needsRestApi).length,
  restApiFilled: ALL_PATTERNS.filter((p) => needsRestApi(p) && p.restApi?.trim()).length,
  concurrencyRelevant: ALL_PATTERNS.filter(needsConcurrency).length,
  concurrencyFilled: ALL_PATTERNS.filter((p) => needsConcurrency(p) && p.concurrencyTest?.trim()).length,
};

console.log('=== Microservices Pattern E2E Coverage ===');
console.log('Total patterns:', counts.total);
console.log('\nField fill counts:');
for (const [key, value] of Object.entries(counts)) {
  if (key !== 'total') {
    console.log(`  ${key}: ${value}/${counts.total}`);
  }
}

console.log('\nDomain-appropriate coverage:');
for (const [key, value] of Object.entries(domainCounts)) {
  console.log(`  ${key}: ${value}`);
}

console.log('\nE2E_GAPS count:', E2E_GAPS.length);
if (E2E_GAPS.length > 0) {
  console.log('First gaps:');
  for (const gap of E2E_GAPS.slice(0, 30)) {
    console.log('  -', gap);
  }
}

try {
  assertFullCoverage();
  console.log('\nassertFullCoverage(): PASS');
} catch (err) {
  console.error('\nassertFullCoverage(): FAIL');
  console.error((err as Error).message);
  process.exitCode = 1;
}

const gapRows = E2E_COVERAGE_ROWS.filter((row) => row[10] === 'GAP');
console.log('\nPatterns with GAP status:', gapRows.length);
