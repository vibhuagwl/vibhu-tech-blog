import type {Metadata} from 'next';
import CapTheoremHub from '@/components/cap-theorem/cap-theorem-hub';

export const metadata: Metadata = {
  title: 'CAP Theorem — Payment Failure Story for Java Interviews',
  description:
    'Learn CAP through two payment DB replicas and a network partition: CP vs AP decisions, Spring Boot code, interactive simulator, quorum, PACELC, and a 2-minute interview answer.',
};

export default function CapTheoremPage() {
  return (
    <main>
      <CapTheoremHub />
    </main>
  );
}
