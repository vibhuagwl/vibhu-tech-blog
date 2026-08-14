import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaMasteryHub from '@/components/kafka-mastery/kafka-mastery-hub';

export const metadata: Metadata = {
  title: 'Kafka Interview Mastery — Monitoring, Sizing, Spoken Answers',
  description:
    'Kafka interview drills only: monitoring, instance counts, replica syncing, partition sizing, and spoken-answer practice. Producer, consumer, and cluster live on dedicated boards.',
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
