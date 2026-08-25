import type {Metadata} from 'next';
import SpringAiHub from '@/components/spring-ai/spring-ai-hub';

export const metadata: Metadata = {
  title: 'Spring AI Financial Intelligence Platform — Principal FinTech Playbook',
  description:
    'Production-grade Spring AI for FinTech: ChatClient, MCP, RAG, embeddings, tools, agents, Kafka, security, human approval, observability, ADRs, and 100+ Staff/Principal interview questions.',
};

export default function SpringAiPage() {
  return (
    <main>
      <SpringAiHub />
    </main>
  );
}
