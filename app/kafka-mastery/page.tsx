import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaMasteryHub from '@/components/kafka-mastery/kafka-mastery-hub';

export const metadata: Metadata = {
  title: 'Kafka Interview Mastery — Producer, Consumer, Cluster, Monitoring, Sizing',
  description:
    'Interview-focused Kafka board: dedicated producer and consumer sections, cluster and controller, optimization, all properties, prod monitoring, instance counts, syncing, and partition sizing.',
};

export default function KafkaMasteryPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka interview mastery...</div>}>
        <KafkaMasteryHub />
      </Suspense>
    </main>
  );
}
