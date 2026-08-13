import type {Metadata} from 'next';
import {Suspense} from 'react';
import MultiTenantHub from '@/components/multi-tenant/multi-tenant-hub';
import {buildSpringMultitenantLabTree, listSpringMultitenantLabFiles} from '@/lib/spring-multitenant-lab-source';

export const metadata: Metadata = {
  title: 'Multi-Tenant SaaS — Spring Boot Architecture & Interview Hub',
  description:
    'Production multi-tenant Order Management SaaS: JWT tenant binding, shared schema + RLS, hybrid databases, Redis, Kafka outbox/DLQ, isolation tests, and Staff/Architect interview answers.',
};

export default function MultiTenantPage() {
  const files = listSpringMultitenantLabFiles();
  const tree = buildSpringMultitenantLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('TenantFilter.java'))?.path
    ?? files.find((f) => f.path.includes('CompositeTenantResolver.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading multi-tenant guide...</div>}>
        <MultiTenantHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
