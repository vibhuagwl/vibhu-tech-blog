import type {Metadata} from 'next';
import {Suspense} from 'react';
import KafkaProductionHub from '@/components/kafka-production/kafka-production-hub';
import {
  buildKafkaProductionTree,
  DEFAULT_KAFKA_PRODUCTION_PATH,
  listKafkaProductionFiles,
} from '@/lib/kafka-production-source';

export const metadata: Metadata = {
  title: 'Kafka Production Deployment & Security — FinTech Reference',
  description:
    'Production-grade Kafka: KRaft, TLS/mTLS, SASL/SCRAM, ACLs, Spring Boot producer/consumer, Kubernetes, monitoring, DR, certificate rotation. Producer → Broker → Consumer.',
};

export default function KafkaProductionPage() {
  const files = listKafkaProductionFiles();
  const tree = buildKafkaProductionTree(files);
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Kafka production board...</div>}>
        <KafkaProductionHub files={files} tree={tree} defaultPath={DEFAULT_KAFKA_PRODUCTION_PATH} />
      </Suspense>
    </main>
  );
}
