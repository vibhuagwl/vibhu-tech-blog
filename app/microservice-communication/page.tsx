import type {Metadata} from 'next';
import MicroserviceCommunicationHub from '@/components/microservice-communication/microservice-communication-hub';

export const metadata: Metadata = {
  title: 'Microservice Communication — A Calls B Interview Mastery',
  description:
    'Staff guide: RestClient, WebClient, OpenFeign, gRPC, Kafka, discovery, K8s, mesh, timeouts, retries, circuit breakers, idempotency, TRICKS-OLD — Spring Boot 3 / Java 21.',
};

export default function MicroserviceCommunicationPage() {
  return (
    <main>
      <MicroserviceCommunicationHub />
    </main>
  );
}
