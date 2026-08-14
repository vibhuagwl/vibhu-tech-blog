import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaConsumerHub from '@/components/kafka-consumer/kafka-consumer-hub';

export const metadata: Metadata = {
  title: 'Kafka Consumer — Groups, poll(), Rebalance, Offsets, Lag, EOS',
  description:
    'Consumer-only deep board: poll() internals, consumer groups, coordinator, rebalancing, commits, fetch, lag, poison/DLQ, Spring patterns, failure matrix, and Staff interview drills.',
};

export default function KafkaConsumerPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka consumer board...</div>}>
        <KafkaConsumerHub />
      </Suspense>
    </main>
  );
}
