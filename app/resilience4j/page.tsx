import type {Metadata} from 'next';
import {Suspense} from 'react';
import Resilience4jHub from '@/components/resilience4j/resilience4j-hub';
import {buildSpringResilience4jLabTree,listSpringResilience4jLabFiles} from '@/lib/spring-resilience4j-lab-source';

export const metadata: Metadata = {
  title: 'Resilience4j in Spring Boot — Complete Production Guide',
  description:
    'Practical Resilience4j: Circuit Breaker, Retry, RateLimiter types, Semaphore vs ThreadPool Bulkhead, Cache, TimeLimiter, Micrometer — stack them together with YAML, Java, and sequence diagrams.',
};

export default function Resilience4jPage() {
  const files = listSpringResilience4jLabFiles();
  const tree = buildSpringResilience4jLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('PaymentGatewayClient.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Resilience4j guide…</div>}>
        <Resilience4jHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
