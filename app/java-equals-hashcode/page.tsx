import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaEqualsHashcodeHub from '@/components/java-equals-hashcode/java-equals-hashcode-hub';

export const metadata: Metadata = {
  title: 'Custom Map Keys Mastery — Hashing, Ordering, Concurrency, JPA, BigDecimal',
  description:
    'Complete Senior/Lead Java lab: custom objects as keys across HashMap, CHM, LinkedHashMap, TreeMap, SkipList, Hashtable, IdentityHashMap, WeakHashMap, EnumMap — internals, inheritance, BigDecimal, Lombok, JPA, caching, exercises, interview bank.',
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
