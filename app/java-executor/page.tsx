import type {Metadata} from 'next';
import JavaExecutorHub from '@/components/java-executor/java-executor-hub';

export const metadata: Metadata = {
  title: 'Java Executor Framework — Production Playbook for Payments',
  description:
    'Deep ThreadPoolExecutor guide for FinTech: core→queue→max→reject algorithm, sizing vs DB pools, rejection policies, Kafka/Spring traps, virtual threads, incidents, and Staff interview scenarios.',
};

export default function JavaExecutorPage() {
  return (
    <main>
      <JavaExecutorHub />
    </main>
  );
}
