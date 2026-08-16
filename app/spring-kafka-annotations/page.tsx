import type {Metadata} from 'next';
import SpringKafkaAnnotationsHub from '@/components/spring-kafka-annotations/spring-kafka-annotations-hub';

export const metadata: Metadata = {
  title: 'Spring Kafka Annotations — Production & Interview Reference',
  description:
    'Standalone Spring Kafka 3.x annotation reference: @KafkaListener, @RetryableTopic, @DltHandler, @SendTo, @Transactional — lifecycle, offsets, retry, DLT, transactions, interaction matrix, and Staff/Principal interview bank.',
};

export default function SpringKafkaAnnotationsPage() {
  return (
    <main>
      <SpringKafkaAnnotationsHub />
    </main>
  );
}
