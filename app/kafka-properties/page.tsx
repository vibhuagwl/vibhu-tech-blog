import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaPropertiesHub from '@/components/kafka-properties/kafka-properties-hub';

export const metadata: Metadata = {
  title: 'Kafka Properties — Must-set + Producer/Consumer/Broker/Controller Catalog',
  description:
    'Professional Kafka 4.0 property board: payment must-set baselines, searchable catalogs for producer, consumer, controller, and broker, Spring mapping, and GO/NO-GO.',
};

export default function KafkaPropertiesPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka properties…</div>}>
        <KafkaPropertiesHub />
      </Suspense>
    </main>
  );
}
