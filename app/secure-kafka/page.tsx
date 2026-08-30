import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SecureKafkaEndpointReference from '@/components/secure-kafka-endpoint-reference';
import SecureKafkaSequenceDiagrams from '@/components/secure-kafka-sequence-diagrams';
import {buildSecureKafkaTree, listSecureKafkaFiles} from '@/lib/secure-kafka-source';

export const metadata = {
  title: 'Secure Kafka — TLS + SASL/OAUTHBEARER + ACL',
  description:
    'Browse the Spring Boot Kafka security lab: Okta OIDC (two authorization servers), SASL_SSL, OAUTHBEARER, Kafka ACLs, HTTP resource server kept separate.',
};

export default function SecureKafkaPage() {
  const files = listSecureKafkaFiles();
  const tree = buildSecureKafkaTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path ??
    files.find((f) => f.path === 'docs/FLOWS.md')?.path ??
    files.find((f) => f.path === 'pom.xml')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Secure Kafka — full source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse every file in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">secure-kafka/</code>: Spring
          Boot producer/consumer, HTTP resource server, Kafka SASL_SSL + OAUTHBEARER, Okta apps, cert/ACL
          scripts, tests, and docs. Okta issues both JWTs (two authorization servers) — Kafka is{' '}
          <strong>not</strong> configured as an HTTP resource server.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/oauth-jwt-demo" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            OAuth + JWT lab →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#endpoints" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            API endpoints →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#interview-flow" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Interview flow →
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://github.com/vibhuagwl/vibhu-tech-blog/tree/main/secure-kafka"
            className="font-semibold text-slate-700 hover:underline dark:text-blue-400"
            target="_blank"
            rel="noreferrer"
          >
            GitHub folder →
          </a>
        </div>
      </header>

      <SecureKafkaEndpointReference />

      <SecureKafkaSequenceDiagrams />

      <div className="mt-10">
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/secure-kafka"
              ariaLabel="Secure Kafka source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
