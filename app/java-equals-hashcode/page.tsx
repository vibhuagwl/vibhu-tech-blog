import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaEqualsHashcodeHub from '@/components/java-equals-hashcode/java-equals-hashcode-hub';

export const metadata: Metadata = {
  title: 'Custom Objects as Map Keys — HashMap, CHM, LinkedHashMap, TreeMap, SkipList',
  description:
    'Senior/Lead Java lab: custom keys in HashMap, ConcurrentHashMap, LinkedHashMap, TreeMap, Hashtable, ConcurrentSkipListMap, IdentityHashMap, EnumMap — equals/hashCode/compareTo, failures, LRU, exercises, interview bank.',
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
