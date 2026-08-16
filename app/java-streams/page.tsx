import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaStreamsHub from '@/components/java-streams/java-streams-hub';
import {buildJavaStreamsLabTree, listJavaStreamsLabFiles} from '@/lib/java-streams-lab-source';

export const metadata: Metadata = {
  title: 'Java Streams — Complete Interview Program Collection (21+ Years)',
  description:
    "200+ Java Stream interview programs for Senior/Staff/Principal: collectors, grouping, parallel traps, FinTech/employee suites, Spliterator, JPA warnings, coding drills, full API coverage checklist.",
};

export default function JavaStreamsPage() {
  const files = listJavaStreamsLabFiles();
  const tree = buildJavaStreamsLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('StreamsLabMain.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Java Streams catalog…</div>}>
        <JavaStreamsHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
