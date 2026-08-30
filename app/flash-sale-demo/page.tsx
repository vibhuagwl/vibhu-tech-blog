import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import FlashSaleEndpointReference from '@/components/flash-sale-endpoint-reference';
import FlashSaleSequenceDiagrams from '@/components/flash-sale-sequence-diagrams';
import {buildFlashSaleTree, FLASH_SALE_CODE_JUMPS, listFlashSaleFiles} from '@/lib/flash-sale-source';

export const metadata = {
  title: 'Flash Sale Microservices — Full Java Source',
  description:
    'Browse the interview-grade flash-sale LLD: Java 21, Spring Boot, Kafka, Redis, PostgreSQL, outbox, saga, atomic inventory.',
};

export default function FlashSaleDemoPage() {
  const files = listFlashSaleFiles();
  const tree = buildFlashSaleTree(files);
  const defaultPath =
    files.find((f) => f.path.endsWith('SubmitPurchaseService.java'))?.path ??
    files.find((f) => f.path.endsWith('ReserveInventoryService.java'))?.path ??
    files.find((f) => f.path === 'pom.xml')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer · Java microservices
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Flash Sale — full microservice source
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Every Java module in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">flash-sale-system/</code>:{' '}
          api-gateway, flash-sale-service, inventory-service, order-service, payment-service, notification-service.
          Redis sheds losers. PostgreSQL never oversells. Kafka + outbox + saga is the async path.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/system-design" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            System design hub →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Kafka hub →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/microservices-patterns" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Saga / outbox patterns →
          </Link>
          <span className="text-slate-300">·</span>
          <a href="#code" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Jump to Java →
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" id="code">
          {FLASH_SALE_CODE_JUMPS.map((jump) => (
            <Link
              key={jump.path}
              href={`/flash-sale-demo?file=${encodeURIComponent(jump.path)}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {jump.label}
            </Link>
          ))}
        </div>
      </header>

      <FlashSaleEndpointReference />
      <FlashSaleSequenceDiagrams />

      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Browse Java source
        </h2>
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time. Expected <code>flash-sale-system/</code> next to this app.
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/flash-sale-demo"
              ariaLabel="Flash sale microservice source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
