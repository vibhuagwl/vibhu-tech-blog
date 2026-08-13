import type {Metadata} from 'next';
import ProductionTroubleshootingHub from '@/components/production-troubleshooting/production-troubleshooting-hub';

export const metadata: Metadata = {
  title: 'Production Troubleshooting Playbook — Architect Incident Guide',
  description:
    'Visual production incident playbook: golden signals, Spring/JVM dumps, cascade failures, DB/Redis/Kafka, AWS/K8s, rollback vs fix-forward, 50 scenarios, P1 escalation.',
};

export default function ProductionTroubleshootingPage() {
  return (
    <main>
      <ProductionTroubleshootingHub />
    </main>
  );
}
