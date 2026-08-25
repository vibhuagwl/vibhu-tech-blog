import type {TocItem} from './types';

export const SPRING_AI_TOC: TocItem[] = [
  {id: 'mission', label: '00. Mission & rules'},
  {id: 'product', label: '01. Product capabilities'},
  {id: 'architecture', label: '02. Reference architecture'},
  {id: 'modules', label: '03. Multi-module structure'},
  {id: 'fundamentals', label: '04. Spring AI fundamentals'},
  {id: 'chatclient', label: '05. ChatClient deep dive'},
  {id: 'prompts', label: '06. Prompt architecture'},
  {id: 'structured', label: '07. Structured output'},
  {id: 'tools', label: '08. Tool calling'},
  {id: 'mcp', label: '09. MCP deep dive'},
  {id: 'mcp-server', label: '10. Financial MCP server'},
  {id: 'mcp-security', label: '11. MCP security'},
  {id: 'rag', label: '12. RAG pipeline'},
  {id: 'embeddings', label: '13. Embeddings internals'},
  {id: 'vector-memory', label: '14. In-memory vector store'},
  {id: 'vectorstore', label: '15. Spring AI VectorStore'},
  {id: 'advisors', label: '16. Advisors'},
  {id: 'memory', label: '17. Conversation memory'},
  {id: 'agents', label: '18. Controlled agents'},
  {id: 'guardrails', label: '19. Agent guardrails'},
  {id: 'kafka', label: '20. Real-time Kafka'},
  {id: 'deterministic', label: '21. Deterministic finance'},
  {id: 'event-ai', label: '22. Event-driven AI'},
  {id: 'hitl', label: '23. Human-in-the-loop'},
  {id: 'injection', label: '24. Prompt injection'},
  {id: 'security', label: '25. Security architecture'},
  {id: 'observability', label: '26. Observability'},
  {id: 'resilience', label: '27. Resilience'},
  {id: 'caching-cost', label: '28. Caching · cost · routing'},
  {id: 'gateway', label: '29. AI Gateway'},
  {id: 'data-api', label: '30. Data model · APIs'},
  {id: 'usecase-pnl', label: '31. E2E: portfolio P&L'},
  {id: 'usecase-payment', label: '32. E2E: payment failure'},
  {id: 'usecase-reversal', label: '33. E2E: reversal + approval'},
  {id: 'testing', label: '34. Testing · performance'},
  {id: 'deploy', label: '35. K8s deployment'},
  {id: 'tradeoffs', label: '36. Architecture trade-offs'},
  {id: 'mistakes', label: '37. Production mistakes'},
  {id: 'adrs', label: '38. ADRs'},
  {id: 'phases', label: '39. Build phases'},
  {id: 'interview-concepts', label: '40. Concept interview packs'},
  {id: 'interview-100', label: '41. 100+ advanced questions'},
  {id: 'checklist', label: '42. Production checklist'},
  {id: 'mock', label: '43. Mock interview'},
];

export const VERSION_NOTE =
  'Spring AI 1.0+ oriented (ChatClient, @Tool, Advisors, VectorStore, MCP). APIs evolve — label version when coding. Sibling: /fintech · /kafka-interview · /spring-security · /resilience4j.';

export const CORE_RULE =
  'AI = orchestration, retrieval, explanation. Java = money math, authorization, audit. Never let the LLM invent P&L or execute unrestricted transfers.';
