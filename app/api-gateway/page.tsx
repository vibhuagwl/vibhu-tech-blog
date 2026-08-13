import type {Metadata} from 'next';
import ApiGatewayHub from '@/components/api-gateway/api-gateway-hub';

export const metadata: Metadata = {
  title: 'API Gateway — Spring / AWS Architect Interview',
  description:
    'Practical API Gateway guide: Spring Cloud Gateway, AWS HTTP/REST/WebSocket APIs, JWT, rate limiting, HA, vs LB/mesh, payment idempotency, 429/502/503/504 troubleshooting.',
};

export default function ApiGatewayPage() {
  return (
    <main>
      <ApiGatewayHub />
    </main>
  );
}
