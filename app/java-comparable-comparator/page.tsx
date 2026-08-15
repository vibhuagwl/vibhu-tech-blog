import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaComparableComparatorHub from '@/components/java-comparable-comparator/java-comparable-comparator-hub';
import {
  buildJavaComparableComparatorDemoTree,
  listJavaComparableComparatorDemoFiles,
} from '@/lib/java-comparable-comparator-demo-source';

export const metadata: Metadata = {
  title: 'Comparable & Comparator — Core Java Interview Mastery',
  description:
    'Complete Senior/Staff guide: compareTo contract, Comparator API, TreeSet/TreeMap, PriorityQueue, BigDecimal, overflow, generics ? super T, TimSort, coding problems, interview bank.',
};

export default function JavaComparableComparatorPage() {
  const files = listJavaComparableComparatorDemoFiles();
  const tree = buildJavaComparableComparatorDemoTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('ComparableLab.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Comparable/Comparator lab…</div>}>
        <JavaComparableComparatorHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
