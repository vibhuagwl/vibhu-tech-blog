import type {Metadata} from 'next';
import {Suspense} from 'react';
import JavaStreamsHub from '@/components/java-streams/java-streams-hub';
import {buildJavaStreamsLabTree, listJavaStreamsLabFiles} from '@/lib/java-streams-lab-source';

export const metadata: Metadata = {
  title: 'Java Streams — Top 100 Tough Programs · Senior / Staff Interview',
  description:
    'SDE3/Staff Java Stream interview prep: Top 100 tough programs, Priority 15 (Nth salary, groupingBy, anagrams, custom Collector), follow-ups on complexity, nulls, parallel — plus full API catalog.',
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
