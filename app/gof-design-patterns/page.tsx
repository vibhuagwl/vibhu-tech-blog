import type {Metadata} from 'next';
import {Suspense} from 'react';
import GofDesignPatternsHub from '@/components/gof-design-patterns/gof-design-patterns-hub';
import {
  buildJavaDesignPatternsRealWorldTree,
  listJavaDesignPatternsRealWorldFiles,
} from '@/lib/java-design-patterns-real-world-source';

export const metadata: Metadata = {
  title: 'GoF Design Patterns — Remember the Problem (Java Interview Playbook)',
  description:
    '23 Gang of Four patterns as FinTech payment problems: bad code → pain → pattern → memory. Flashcards, guess-the-pattern, decision tree, Spring links, runnable lab.',
};

export default function GofDesignPatternsPage() {
  const files = listJavaDesignPatternsRealWorldFiles();
  const tree = buildJavaDesignPatternsRealWorldTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('DesignPatternDemo.java'))?.path
    ?? files.find((f) => f.path.includes('PaymentStrategyDemo.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading GoF design patterns…</div>}>
        <GofDesignPatternsHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
