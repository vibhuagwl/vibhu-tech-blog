import type {Metadata} from 'next';
import CapTheoremHub from '@/components/cap-theorem/cap-theorem-hub';

export const metadata: Metadata = {
  title: 'CAP Theorem — Interview Stories You Can Draw',
  description:
    'Story-first CAP for system design: bank branches, ATM, likes, seats, quorum, split brain, PACELC, Kafka receipts — Mermaid diagrams, 60s answers, whiteboard beats.',
};

export default function CapTheoremPage() {
  return (
    <main>
      <CapTheoremHub />
    </main>
  );
}
