import type {Metadata} from 'next';
import LoadBalancingHub from '@/components/load-balancing/load-balancing-hub';

export const metadata: Metadata = {
  title: 'Load Balancing — Java / Spring / AWS Architect Interview',
  description:
    'Visual load balancing masterclass: L4/L7, ALB/NLB, algorithms, health checks, API Gateway vs LB, Spring Cloud LoadBalancer, banking architectures.',
};

export default function LoadBalancingPage() {
  return (
    <main>
      <LoadBalancingHub />
    </main>
  );
}
