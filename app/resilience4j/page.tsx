import type {Metadata} from 'next';
import Resilience4jHub from '@/components/resilience4j/resilience4j-hub';

export const metadata: Metadata = {
  title: 'Resilience4j — Java / Spring Boot Architect Interview',
  description:
    'Practical Resilience4j guide: circuit breaker, retry, bulkhead, rate limiter, TimeLimiter, Spring Boot 3, payment failures, Kafka/Redis/DB, observability, interview bank.',
};

export default function Resilience4jPage() {
  return (
    <main>
      <Resilience4jHub />
    </main>
  );
}
