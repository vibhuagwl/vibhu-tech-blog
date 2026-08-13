import type {Metadata} from 'next';
import DistributedCachingHub from '@/components/distributed-caching/distributed-caching-hub';

export const metadata: Metadata = {
  title: 'Distributed Caching in Spring — Architect Interview Masterclass',
  description:
    'Staff/Principal Spring distributed caching: Redis, Caffeine, L1/L2, stampede, Kafka invalidation, consistency, and production Spring Boot patterns.',
};

export default function DistributedCachingPage() {
  return (
    <main>
      <DistributedCachingHub />
    </main>
  );
}
