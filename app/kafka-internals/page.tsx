import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kafka Internals (moved)',
  description:
    'Kafka internals content lives on the Cluster board (replication, ISR, storage) and Interview Mastery (syncing, instances, spoken answers).',
};

export default function KafkaInternalsMovedPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">Moved</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
        Kafka Internals board removed
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
        This survey board duplicated Producer, Consumer, Cluster, and Mastery. Use the canonical boards
        instead:
      </p>
      <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
        <li>
          <Link href="/kafka-cluster#replication" className="font-semibold underline-offset-2 hover:underline">
            Cluster → replication / ISR / HW
          </Link>{' '}
          — broker internals, storage, elections
        </li>
        <li>
          <Link href="/kafka-mastery#syncing" className="font-semibold underline-offset-2 hover:underline">
            Mastery → syncing
          </Link>{' '}
          ·{' '}
          <Link href="/kafka-mastery#instances" className="font-semibold underline-offset-2 hover:underline">
            instances
          </Link>{' '}
          ·{' '}
          <Link href="/kafka-mastery#interview" className="font-semibold underline-offset-2 hover:underline">
            spoken answers
          </Link>
        </li>
        <li>
          <Link href="/kafka-producer" className="font-semibold underline-offset-2 hover:underline">
            Producer
          </Link>{' '}
          write path ·{' '}
          <Link href="/kafka-consumer" className="font-semibold underline-offset-2 hover:underline">
            Consumer
          </Link>{' '}
          crash / commit replay
        </li>
        <li>
          <Link href="/kafka-interview" className="font-semibold underline-offset-2 hover:underline">
            Kafka interview hub
          </Link>
        </li>
      </ul>
    </main>
  );
}
