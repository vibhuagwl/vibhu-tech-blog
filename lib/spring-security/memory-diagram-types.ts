export type MemoryDiagram = {
  id: string;
  group: string;
  title: string;
  hook: string;
  mermaid: string;
  anchors?: {id: string; label: string}[];
};

export const MEMORY_DIAGRAM_GROUPS = [
  'Overview',
  'Network & TLS',
  'Cryptography',
  'OAuth & Tokens',
  'Identity & Sessions',
  'Authorization',
  'App Threats & Headers',
  'Cloud · API · Data',
  'Operations & Testing',
] as const;
