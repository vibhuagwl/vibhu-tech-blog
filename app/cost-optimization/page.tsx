import type {Metadata} from 'next';
import CostOptimizationHub from '@/components/cost-optimization/cost-optimization-hub';

export const metadata: Metadata = {
  title: 'Cloud Cost Optimization & Impact Analysis — Architect Guide',
  description:
    'FinOps-aware AWS cost guide for Staff/Architect interviews: capacity math, Java cost, N+1, NAT, amplification, Kafka/Redis, TCO, cost/txn, tools, production spikes.',
};

export default function CostOptimizationPage() {
  return (
    <main>
      <CostOptimizationHub />
    </main>
  );
}
