import Link from 'next/link';
import ExperienceHub from '@/components/experience-hub';
import {JPMC_HUB} from '@/lib/jpmc-hub';

export const metadata={
  title:'JPMC Experience — Hadron, Tax, RSU & Platform Interview Hub',
  description:JPMC_HUB.description,
};

export default function JpmcExperience(){
  return (
    <main>
      <ExperienceHub
        title={JPMC_HUB.title}
        subtitle={JPMC_HUB.subtitle}
        description={JPMC_HUB.description}
        sections={JPMC_HUB.sections}
        modes={[
          {
            title:'Tell the story',
            blurb:'Cashlines, onboarding, tax, RSU — what problem we solved and what you owned.',
          },
          {
            title:'Defend the design',
            blurb:'Kafka failures, CDC, Camunda/Drools, async tracking — trade-offs and alternatives.',
          },
          {
            title:'Prove production readiness',
            blurb:'Replay, monitoring, Terraform, Harness, migration, testing, and incident recovery.',
          },
        ]}
      />

      <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick entry</h2>
        <p className="mt-2 text-sm text-slate-500">Common interview intents — pick one and go deep.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-hadron-cashlines">
              Cashlines end-to-end →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-kafka-replay-tool">
              Kafka replay tool story →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-deloitte-tax">
              Deloitte tax integration →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-star-stories">
              STAR stories bank →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-top-100-questions">
              Top 100 questions →
            </Link>
          </li>
          <li>
            <Link className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400" href="/jpmc-experience/jpmc-cheat-sheet">
              One-page cheat sheet →
            </Link>
          </li>
        </ul>
        <p className="mt-6 text-xs leading-5 text-slate-500">
          Honest detail rule: numbers, volumes, exact service names, and incident timelines that are not confirmed are marked
          {' '}<code className="rounded bg-slate-100 px-1 dark:bg-slate-900">[NEEDS MY REAL PROJECT DETAIL]</code>.
          Do not invent them in interviews.
        </p>
      </section>
    </main>
  );
}
