import type {Metadata} from 'next';
import ProductionTroubleshootingHub from '@/components/production-troubleshooting/production-troubleshooting-hub';

export const metadata: Metadata = {
  title: 'Production Troubleshooting — 15+ YOE Incident Commander Handbook',
  description:
    'Staff/Principal production engineer handbook: IC mindset, investigation framework, immediate vs permanent fixes, 90+ war-room scenarios, multi-layer incidents, Debezium/CDC, MongoDB, K8s/AWS commands, anti-patterns, postmortems, and interview drills. Links to Performance, Real-Time Issues, Kafka, and Resilience4j instead of duplicating them.',
  keywords: [
    'production troubleshooting',
    'incident commander',
    'Kafka lag',
    'Debezium CDC',
    'PostgreSQL locks',
    'HikariCP',
    'Kubernetes OOMKilled',
    'production engineer interview',
    'root cause analysis',
    'blameless postmortem',
  ],
};

export default function ProductionTroubleshootingPage() {
  return (
    <main>
      <ProductionTroubleshootingHub />
    </main>
  );
}
