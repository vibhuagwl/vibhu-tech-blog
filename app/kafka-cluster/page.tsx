import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaClusterHub from '@/components/kafka-cluster/kafka-cluster-hub';

export const metadata: Metadata = {
  title: 'Kafka Cluster & Broker — KRaft, Replication, ISR, Storage, Ops',
  description:
    'Cluster/broker-only deep board: KRaft, request path, partitions, replication, ISR, HW, leader epochs, storage, page cache, multi-AZ, capacity, quotas, monitoring, and Staff failure war games.',
};

export default function KafkaClusterPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka cluster board...</div>}>
        <KafkaClusterHub />
      </Suspense>
    </main>
  );
}
