import type {Metadata} from 'next';
import {Suspense} from 'react';
import SpringAiHub from '@/components/spring-ai/spring-ai-hub';
import {buildSpringAiDemoTree, listSpringAiDemoFiles} from '@/lib/spring-ai-demo-source';

export const metadata: Metadata = {
  title: 'Spring AI Financial Intelligence Platform — Principal FinTech Playbook',
  description:
    'Production-grade Spring AI for FinTech: ChatClient, MCP, RAG, embeddings, tools, agents, Kafka, security, human approval, observability, ADRs, and 100+ Staff/Principal interview questions.',
};

export default function SpringAiPage() {
  const files = listSpringAiDemoFiles();
  const tree = buildSpringAiDemoTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path.includes('FinancialAiOrchestrator.java'))?.path ??
    files[0]?.path ??
    '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Spring AI hub…</div>}>
        <SpringAiHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
