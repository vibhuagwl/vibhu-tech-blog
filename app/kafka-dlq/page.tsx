import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaDlqHub from '@/components/kafka-dlq/kafka-dlq-hub';
import {buildHadronDlqLabTree, listHadronDlqLabFiles} from '@/lib/spring-hadron-dlq-source';

export const metadata: Metadata = {
  title: 'Kafka DLQ / DLT / Retry — Staff Production Guide',
  description:
    'Exhaustive Kafka Dead Letter Topic guide: producer ≠ consumer DLQ, Spring DefaultErrorHandler, DLT publish failure, EOS vs PostgreSQL, replay loops, payments reconcile, 50 corner cases, 110 Staff interview questions with wrong answers.',
};

export default function KafkaDlqPage() {
  const hadronFiles = listHadronDlqLabFiles();
  const hadronTree = buildHadronDlqLabTree(hadronFiles);
  const hadronDefault =
    hadronFiles.find((f) => f.path.includes('CashLineProcessingService.java'))?.path
    ?? hadronFiles.find((f) => f.path.includes('FailurePipeline.java'))?.path
    ?? hadronFiles.find((f) => f.path === 'README.md')?.path
    ?? hadronFiles[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka DLQ board...</div>}>
        <KafkaDlqHub
          hadronFiles={hadronFiles}
          hadronTree={hadronTree}
          hadronDefaultPath={hadronDefault}
        />
      </Suspense>
    </main>
  );
}
