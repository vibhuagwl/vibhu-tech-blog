import type {Metadata} from 'next';
import {Suspense} from 'react';
import HadronDlqHub from '@/components/hadron-dlq/hadron-dlq-hub';
import {buildHadronDlqLabTree, listHadronDlqLabFiles} from '@/lib/spring-hadron-dlq-source';

export const metadata: Metadata = {
  title: 'Hadron CashLines DLQ — Kafka Retry, Ordering, Replay',
  description:
    'Production Dead Letter Queue for Hadron CashLines: Spring Kafka retry topics, PostgreSQL DLQ persistence, idempotency, ordering, Neptune poller, and Staff interview answers.',
};

export default function HadronDlqPage() {
  const files = listHadronDlqLabFiles();
  const tree = buildHadronDlqLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('CashLineProcessingService.java'))?.path
    ?? files.find((f) => f.path.includes('FailurePipeline.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Hadron DLQ guide...</div>}>
        <HadronDlqHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
