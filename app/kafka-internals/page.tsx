import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaInternalsHub from '@/components/kafka-internals/kafka-internals-hub';

export const metadata: Metadata = {
  title: 'Kafka Internals Board — Replication, Partitions, Production Deploy',
  description:
    'Staff-level Kafka internals: how brokers write partitions, how replicas fetch, how many instances you need in production, and what happens when a consumer dies.',
};

export default function KafkaInternalsPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka internals board...</div>}>
        <KafkaInternalsHub />
      </Suspense>
    </main>
  );
}
