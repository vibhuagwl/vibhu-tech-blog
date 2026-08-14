import type {TocItem} from './types';

export const MULTI_TENANT_TOC: TocItem[] = [
  {id: 'overview', label: 'Business Story'},
  {id: 'architecture', label: 'Recommended Architecture'},
  {id: 'code-sequences', label: 'Request Sequences'},
  {id: 'strategies', label: 'DB Strategies'},
  {id: 'identify', label: 'Identify Tenant'},
  {id: 'context', label: 'TenantContext'},
  {id: 'security', label: 'JWT + Isolation'},
  {id: 'shared-schema', label: 'Shared Schema'},
  {id: 'rls', label: 'PostgreSQL RLS'},
  {id: 'onboarding', label: 'Onboarding Saga'},
  {id: 'cache', label: 'Redis Cache Keys'},
  {id: 'kafka', label: 'Kafka + Outbox'},
  {id: 'noisy', label: 'Noisy Neighbor'},
  {id: 'threats', label: 'Threat Model'},
  {id: 'mistakes', label: 'Production Mistakes'},
  {id: 'interview', label: 'Interview Qs'},
  {id: 'storytelling', label: '2 / 5 / 10 min'},
  {id: 'lab', label: 'Runnable Lab'},
  {id: 'checklist', label: 'Production Checklist'},
  {id: 'cheat-sheet', label: 'Cheat Sheet'},
];
