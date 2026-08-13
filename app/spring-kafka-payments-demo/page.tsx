import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import {buildSpringKafkaPaymentsDemoTree,listSpringKafkaPaymentsDemoFiles} from '@/lib/spring-kafka-payments-demo-source';

export const metadata={
  title:'Spring Kafka payments demo — full source',
  description:'Browse runnable Spring Kafka payment-api and settlement-worker code with DLQ, retries, manual ack, batching, compression, and custom keys.',
};

export default function SpringKafkaPaymentsDemoPage(){
  const files=listSpringKafkaPaymentsDemoFiles();
  const tree=buildSpringKafkaPaymentsDemoTree(files);
  const defaultPath=files.find((f)=>f.path==='README.md')?.path
    ?? files.find((f)=>f.path.includes('PaymentController.java'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Source explorer
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Spring Kafka payments microservices
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Browse <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-kafka-payments-demo/</code>:
          producer controller, broker config, custom keys, batching, compression, manual commits, retries, DLQ, and consumer failure handling.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/realtime-issues/spring-kafka-dlq-payments" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Real-time guide →
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/realtime-issues/stuck-thread-spring-kafka-locks" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Kafka incident page →
          </Link>
        </div>
      </header>

      <div className="mt-10">
        {files.length===0?(
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ):(
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/spring-kafka-payments-demo"
              ariaLabel="Spring Kafka payments demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
