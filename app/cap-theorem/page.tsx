import type {Metadata} from 'next';
import CapTheoremHub from '@/components/cap-theorem/cap-theorem-hub';

export const metadata: Metadata = {
  title: 'CAP Theorem — End-to-End Interview Mastery',
  description:
    'Complete Senior/Staff CAP + PACELC guide: consistency models, quorum, Kafka/Cassandra/Mongo knobs, multi-region, Saga, traps, rapid-fire, spoken answers.',
};

export default function CapTheoremPage() {
  return (
    <main>
      <CapTheoremHub />
    </main>
  );
}
