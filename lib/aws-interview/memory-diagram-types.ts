export type MemoryDiagram = {
  id: string;
  group: string;
  title: string;
  hook: string;
  mermaid: string;
  anchors?: {id: string; label: string}[];
};

export const AWS_MEMORY_GROUPS = [
  'Overview',
  'Foundations',
  'Compute',
  'Network',
  'Storage & Data',
  'Messaging',
  'Security',
  'Ops & Reliability',
  'Design & Spring',
  'Comparisons',
  'Troubleshooting',
] as const;
