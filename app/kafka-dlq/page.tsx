import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaDlqHub from '@/components/kafka-dlq/kafka-dlq-hub';
import {buildHadronDlqLabTree, listHadronDlqLabFiles} from '@/lib/spring-hadron-dlq-source';

export const metadata: Metadata = {
  title: 'Kafka DLQ / DLT / Retry — Unified Guide (Payments + Hadron)',
  description:
    'Single final page for Kafka Dead Letter Topic, retry topics, Spring DefaultErrorHandler, DeadLetterPublishingRecoverer, payments settlement demo, and Hadron CashLines case study — delete duplicates of /hadron-dlq and kafka-payments-dlq.',
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
