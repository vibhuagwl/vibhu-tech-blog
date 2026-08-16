import type {Metadata} from 'next';
import MicroserviceCommunicationHub from '@/components/microservice-communication/microservice-communication-hub';

export const metadata: Metadata = {
  title: 'Microservice Communication — Production & Staff Interview Guide',
  description:
    'FinTech-first guide: when REST vs Kafka vs gRPC, hybrid payment architectures, retry+idempotency, circuit breakers, saga, failure playbooks, and senior interview answers — Spring Boot 3 / Java 21.',
};

export default function MicroserviceCommunicationPage() {
  return (
    <main>
      <MicroserviceCommunicationHub />
    </main>
  );
}
