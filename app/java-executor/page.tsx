import type {Metadata} from 'next';
import JavaExecutorHub from '@/components/java-executor/java-executor-hub';

export const metadata: Metadata = {
  title: 'Java Executor Framework — Senior/Staff Interview Playbook',
  description:
    'Practical ThreadPoolExecutor guide: core→queue→max→reject, 15 broken-code drills, payment/Kafka/Spring scenarios, Future cancel, CF pipelines, rejection labs, decision trees, and Staff interview Q&A.',
};

export default function JavaExecutorPage() {
  return (
    <main>
      <JavaExecutorHub />
    </main>
  );
}
