import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hadron CashLines DLQ (moved)',
  description:
    'Hadron CashLines DLQ content now lives on the unified Kafka DLQ / DLT / Retry board at /kafka-dlq.',
};

export default function HadronDlqMovedPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Moved</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
        Hadron CashLines DLQ merged into Kafka DLQ
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
        This page duplicated the canonical failure-recovery board. Use the single final page:
      </p>
      <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
        <li>
          <Link href="/kafka-dlq#hadron-story" className="font-semibold underline-offset-2 hover:underline">
            Kafka DLQ → Hadron CashLines case study
          </Link>{' '}
          — Neptune story, decision matrix, checklist
        </li>
        <li>
          <Link href="/kafka-dlq#hadron-sequences" className="font-semibold underline-offset-2 hover:underline">
            Lifecycle sequences
          </Link>{' '}
          ·{' '}
          <Link href="/kafka-dlq#hadron-corners" className="font-semibold underline-offset-2 hover:underline">
            35 corner cases
          </Link>{' '}
          ·{' '}
          <Link href="/kafka-dlq#labs" className="font-semibold underline-offset-2 hover:underline">
            Runnable lab explorer
          </Link>
        </li>
        <li>
          <Link href="/kafka-dlq" className="font-semibold underline-offset-2 hover:underline">
            Full DLQ / DLT / Retry board
          </Link>{' '}
          — classification, Spring handlers, payments demo, interview drills
        </li>
      </ul>
    </main>
  );
}
