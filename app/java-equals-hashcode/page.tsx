import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaEqualsHashcodeHub from '@/components/java-equals-hashcode/java-equals-hashcode-hub';

export const metadata: Metadata = {
  title: 'Java equals() & hashCode() — HashMap, LinkedHashMap, ConcurrentHashMap, TreeMap',
  description:
    'All equals/hashCode combinations for map keys — verified on HashMap, LinkedHashMap, ConcurrentHashMap, and TreeMap. Interview drills and runnable Java 21 lab.',
};

export default function JavaEqualsHashcodePage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading equals/hashCode lab...</div>}>
        <JavaEqualsHashcodeHub />
      </Suspense>
    </main>
  );
}
