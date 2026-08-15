import type {Metadata} from 'next';
import {Suspense} from 'react';
import MicroservicesPatternsHub from '@/components/microservices-patterns/microservices-patterns-hub';
import {buildSpringMspLabTree, listSpringMspLabFiles} from '@/lib/spring-msp-lab-source';

export const metadata: Metadata = {
  title: 'Microservices Design Patterns — Complete Implementation Master Guide',
  description:
    '154 pattern cards with Java 21 + Spring Boot code: decomposition, gateway, resilience, saga, outbox, Kafka, caching, locking, GoF, EIP, 500 interview questions, decision trees.',
};

export default function MicroservicesPatternsPage() {
  const files = listSpringMspLabFiles();
  const tree = buildSpringMspLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('MspLabApplication.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading microservices patterns…</div>}>
        <MicroservicesPatternsHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
