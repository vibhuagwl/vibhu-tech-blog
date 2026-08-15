import type {Metadata} from 'next';
import PerformanceHub from '@/components/performance/performance-hub';

export const metadata: Metadata = {
  title: 'Performance Engineering — Java · Spring · AWS Interview Handbook',
  description:
    'Staff/Principal performance handbook: investigation master framework, JVM/JIT/GC internals, networking, MVCC/WAL, distributed systems, Kafka deep, AWS cost×performance, JMH methodology, Little/Amdahl/USL, Spring/JPA/Hikari/Redis, and interview drills.',
  keywords: [
    'Java performance optimization',
    'Spring Boot performance',
    'JVM tuning',
    'JIT compilation',
    'garbage collection',
    'G1 ZGC',
    'Hibernate performance',
    'HikariCP',
    'PostgreSQL MVCC',
    'Kafka performance',
    'AWS cost performance',
    'JMH benchmark',
    'Little\'s Law',
    'performance engineering interview',
  ],
};

export default function PerformancePage() {
  return (
    <main>
      <PerformanceHub />
    </main>
  );
}
