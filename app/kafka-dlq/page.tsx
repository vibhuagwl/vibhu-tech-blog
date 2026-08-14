import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaDlqHub from '@/components/kafka-dlq/kafka-dlq-hub';

export const metadata: Metadata = {
  title: 'Kafka DLQ / DLT — Complete Retry, Recovery & Spring Guide',
  description:
    'Staff/Principal Kafka Dead Letter Topic board: failure classification, retry topics, Spring DefaultErrorHandler, DeadLetterPublishingRecoverer, offsets, ordering, replay, payments, and interview drills. Kafka has no built-in DLQ — this is the full architecture.',
};

export default function KafkaDlqPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka DLQ board...</div>}>
        <KafkaDlqHub />
      </Suspense>
    </main>
  );
}
