import type {Metadata} from 'next';
import KafkaInfraHub from '@/components/kafka-infra/kafka-infra-hub';

export const metadata: Metadata = {
  title: 'Kafka Production Infrastructure — System Design Interview Master',
  description:
    'How many brokers, controllers, partitions, consumers? Multi-AZ/region, ISR, capacity, incidents, temp vs permanent fixes, Staff-level Kafka infra answers.',
};

export default function KafkaInfraPage() {
  return (
    <main>
      <KafkaInfraHub />
    </main>
  );
}
