import type {Metadata} from 'next';
import {Suspense} from 'react';
import SpringSecurityHub from '@/components/spring-security/spring-security-hub';

export const metadata: Metadata = {
  title: 'Spring Security & Architecture Security Hub — Staff Interview',
  description:
    'Senior/Staff Java + Spring Security hub: HTTP/HTTPS/TLS/mTLS, keystore/truststore, JWT/OAuth/OIDC/SAML, CSRF/CORS/XSS/SQLi, AWS KMS/Secrets, Kafka/DB security — 90% code, diagrams, runnable labs.',
};

export default function SpringSecurityPage() {
  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Spring Security hub…</div>}>
        <SpringSecurityHub />
      </Suspense>
    </main>
  );
}
