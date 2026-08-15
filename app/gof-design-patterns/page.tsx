import type {Metadata} from 'next';
import {Suspense} from 'react';
import GofDesignPatternsHub from '@/components/gof-design-patterns/gof-design-patterns-hub';
import {
  buildJavaDesignPatternsRealWorldTree,
  listJavaDesignPatternsRealWorldFiles,
} from '@/lib/java-design-patterns-real-world-source';

export const metadata: Metadata = {
  title: 'GoF Design Patterns — End-to-End Implementation Master',
  description:
    'All 23 Gang of Four design patterns in the Microservices Patterns format: Why, Architecture, Code, Failures, Ops, Interview — Meridian Bank payment story + Java 21 lab.',
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
