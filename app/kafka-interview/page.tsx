import Link from 'next/link';
import TechnologyHub from '@/components/technology-hub';
import {KAFKA_HUB} from '@/lib/technology-hub';

export const metadata={
  title:'Kafka — Knowledge, Experience, Optimization & Interview Hub',
  description:KAFKA_HUB.description,
};

export default function KafkaInterview(){
  return (
    <main>
      <TechnologyHub
        title={KAFKA_HUB.title}
        subtitle={KAFKA_HUB.subtitle}
        description={KAFKA_HUB.description}
        sections={KAFKA_HUB.sections}
        modes={[
          {
            title:'Learn',
            blurb:'Knowledge, optimization, and configuration — understand how Kafka works and how to tune it.',
          },
          {
            title:'Experience',
            blurb:'Production incidents, troubleshooting, and upgrades — how Kafka behaves under real load and failure.',
          },
          {
            title:'Recall',
            blurb:'Interview banks, cheat sheets, and 1/5-minute revision before a Staff or Principal round.',
          },
        ]}
      />

      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Spring Kafka practical hub</h2>
        <p className="mt-2 text-sm text-slate-500">Code-first pages grouped under Kafka so you do not need separate tabs.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/spring-kafka-payments-demo" className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kafka Code</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Spring microservices source explorer: producer, consumer, DLQ, retry, manual offset, and broker config.</p>
          </Link>
          <Link href="/realtime-issues/spring-kafka-dlq-payments" className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kafka Practical Flow</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Controller → producer → broker → consumer → retry/DLQ with real payment example.</p>
          </Link>
          <Link href="/realtime-issues/spring-kafka-payments-interview-story" className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kafka Interview Story</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">30-second, 90-second, and 5-minute answers from one real Spring Kafka flow.</p>
          </Link>
          <Link href="/realtime-issues/spring-kafka-full-properties-checklist" className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kafka Full Properties</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Producer, consumer, and broker property checklist with descriptions and GO/NO-GO guidance.</p>
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick entry</h2>
        <p className="mt-2 text-sm text-slate-500">Common intents — pick one and go deep.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-knowledge-consumer-groups">
              Why consumer groups exist →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-experience-consumer-lag">
              Consumer lag incident walkthrough →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-optimization-producer">
              Producer optimization →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-config-batch-size">
              batch.size configuration detail →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-troubleshooting-consumer-lag">
              Lag troubleshooting playbook →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/kafka-interview/kafka-cheat-sheet">
              Kafka cheat sheet →
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
