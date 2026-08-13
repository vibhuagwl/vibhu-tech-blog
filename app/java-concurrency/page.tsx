import type {Metadata} from 'next';
import JavaConcurrencyHub from '@/components/java-concurrency/java-concurrency-hub';

export const metadata:Metadata={
  title:'Java Concurrency — Internals, APIs & Production (Java 1→25)',
  description:
    'Principal/Architect Java concurrency laboratory: JMM, AQS, CAS, ThreadPoolExecutor, CompletableFuture, ConcurrentHashMap, Virtual Threads, Scoped Values (final in 25), Structured Concurrency (preview in 25).',
};

export default function JavaConcurrencyPage(){
  return (
    <main>
      <JavaConcurrencyHub/>
    </main>
  );
}
