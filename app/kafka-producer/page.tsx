import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaProducerHub from '@/components/kafka-producer/kafka-producer-hub';

export const metadata: Metadata = {
  title: 'Kafka Producer — Complete Internals, Config, Failures, Spring, Interview',
  description:
    'Producer-only deep board: send() lifecycle through wire protocol, error classification, fencing, shutdown, quotas, rack/AZ, DNS, Kafka 4.x configs, Spring, pathological corner cases, and Staff interview drills.',
};

export default function KafkaProducerPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka producer board...</div>}>
        <KafkaProducerHub />
      </Suspense>
    </main>
  );
}
