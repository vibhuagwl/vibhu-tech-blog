import type {Metadata} from 'next';
import KafkaInfraHub from '@/components/kafka-infra/kafka-infra-hub';

export const metadata: Metadata = {
  title: 'Kafka Production Infrastructure — Staff System Design Interview Master',
  description:
    '12+ YOE Kafka infra: networking, request path, ISR/HW/LEO, Connect/Streams, quotas, chaos/DR, 500K TPS calc, Interview War Room, end-to-end message trace.',
};

export default function KafkaInfraPage() {
  return (
    <main>
      <KafkaInfraHub />
    </main>
  );
}
