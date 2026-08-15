import type {Metadata} from 'next';
import PerformanceHub from '@/components/performance/performance-hub';

export const metadata: Metadata = {
  title: 'Performance Engineering — Java · Spring · AWS Interview Handbook',
  description:
    'Staff/Principal performance guide: measure → bottleneck → optimize → validate. Java 21, JVM/GC, Spring Boot, JPA, HikariCP, SQL/indexing, Redis, Kafka, AWS (ALB/ECS/RDS/Aurora/DynamoDB), profiling, load testing, and interview drills.',
  keywords: [
    'Java performance optimization',
    'Spring Boot performance',
    'JVM tuning',
    'garbage collection',
    'Hibernate performance',
    'HikariCP',
    'PostgreSQL performance',
    'Kafka performance',
    'AWS performance',
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
