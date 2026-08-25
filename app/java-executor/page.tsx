import type {Metadata} from 'next';
import JavaExecutorHub from '@/components/java-executor/java-executor-hub';

export const metadata: Metadata = {
  title: 'Java Executor Framework — Complete Interview Reference',
  description:
    'Senior/Staff Java Executor + CompletableFuture guide: hierarchy, ThreadPoolExecutor CORE→QUEUE→MAX→REJECT, CompletionService, invokeAll/Any, CF composition, 15 coding problems, 50+ Q&A.',
};

export default function JavaExecutorPage() {
  return (
    <main>
      <JavaExecutorHub />
    </main>
  );
}
