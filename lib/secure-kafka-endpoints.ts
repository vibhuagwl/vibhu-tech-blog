import type {EndpointRow, FlowStep} from '@/lib/oauth-jwt-endpoints';

export type {EndpointRow, FlowStep};

export const SERVICES = [
  {name: 'Okta OIDC', port: '443', role: 'Cloud IdP — two custom authorization servers (payment-api vs kafka). Client-credentials only.'},
  {name: 'Kafka KRaft', port: '9093', role: 'SASL_SSL broker — JWT authn + StandardAuthorizer ACLs'},
  {name: 'Payment API', port: '8081', role: 'Spring Boot — HTTP resource server + Kafka producer/consumer'},
] as const;

export const ARCHITECTURE = `Caller
      │  POST /oauth2/{apiAs}/v1/token  (client_credentials payment-api)
      ▼
Okta OIDC (:443)   two custom authorization servers
  GET  /oauth2/{apiAs}/.well-known/oauth-authorization-server
  POST /oauth2/{apiAs}/v1/token
  GET  /oauth2/{apiAs}/v1/keys
      │  JWT aud=payment-api  scp=payment:write
      ▼
Payment API (:8081)     Spring Security Resource Server
  GET  /actuator/health          public
  POST /api/payments             SCOPE_payment:write
  GET  /api/payments             SCOPE_payment:read | write
      │
      │  DIFFERENT issuer + token: client_credentials payment-producer
      │  POST /oauth2/{kafkaAs}/v1/token
      │  JWT aud=kafka  azp=payment-producer (cid is Okta's native app id)
      ▼
Kafka SASL_SSL (:9093)
  TLS handshake (truststore)
  SASL/OAUTHBEARER  →  OAuthBearerValidatorCallbackHandler + /v1/keys
  ACL  User:payment-producer  WRITE payments
      │
      ▼
Topic payments  →  PaymentConsumer (payment-consumer + group payment-service)`;

export const IDP_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/oauth2/{as}/.well-known/oauth-authorization-server',
    service: 'Okta',
    port: '443',
    purpose: 'Discovery — issuer, token_endpoint, jwks_uri (one URL per authorization server)',
    auth: 'Public',
    flow: 'All',
  },
  {
    method: 'POST',
    path: '/oauth2/{as}/v1/token',
    service: 'Okta',
    port: '443',
    purpose: 'Client-credentials grant — payment-api AS for HTTP; kafka AS for SASL clients',
    auth: 'Basic client_id:client_secret',
    flow: 'HTTP + Kafka',
  },
  {
    method: 'GET',
    path: '/oauth2/{as}/v1/keys',
    service: 'Okta',
    port: '443',
    purpose: 'JWKS — HTTP JwtDecoder (api AS) and Kafka OAuthBearerValidatorCallbackHandler (kafka AS)',
    auth: 'Public',
    flow: 'JWT validation',
  },
];

export const API_ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/actuator/health',
    service: 'Payment API',
    port: '8081',
    purpose: 'Liveness only — fail-closed elsewhere',
    auth: 'Public',
    flow: 'Ops',
  },
  {
    method: 'POST',
    path: '/api/payments',
    service: 'Payment API',
    port: '8081',
    purpose: 'Publish PaymentEvent to Kafka topic payments',
    auth: 'Bearer JWT · SCOPE_payment:write · aud=payment-api',
    flow: 'HTTP then produce',
  },
  {
    method: 'GET',
    path: '/api/payments',
    service: 'Payment API',
    port: '8081',
    purpose: 'List events consumed in-process',
    auth: 'Bearer JWT · SCOPE_payment:read or write',
    flow: 'HTTP',
  },
];

export const KAFKA_ENDPOINTS: EndpointRow[] = [
  {
    method: 'SASL',
    path: 'SASL_SSL://localhost:9093',
    service: 'Kafka',
    port: '9093',
    purpose: 'Client → broker: TLS + OAUTHBEARER (not HTTP)',
    auth: 'JWT aud=kafka · principal azp (Okta cid if claim skipped)',
    flow: 'Produce / consume',
  },
  {
    method: 'ACL',
    path: 'topic payments',
    service: 'Kafka',
    port: '9093',
    purpose: 'WRITE+DESCRIBE for User:payment-producer; READ+DESCRIBE for User:payment-consumer',
    auth: 'StandardAuthorizer',
    flow: 'Authorization',
  },
  {
    method: 'ACL',
    path: 'group payment-service',
    service: 'Kafka',
    port: '9093',
    purpose: 'READ group — required to join / commit, not implied by topic READ',
    auth: 'User:payment-consumer',
    flow: 'Consume',
  },
  {
    method: 'ACL',
    path: 'topic payments.DLT',
    service: 'Kafka',
    port: '9093',
    purpose: 'WRITE for consumer poison-path only — authn/authz failures do not go here',
    auth: 'User:payment-consumer',
    flow: 'DLT',
  },
];

export const TOKEN_CLIENTS = [
  {
    client: 'payment-api',
    audience: 'payment-api',
    usedBy: 'Caller → POST /api/payments',
    plane: 'Spring Security Resource Server',
  },
  {
    client: 'payment-producer',
    audience: 'kafka',
    usedBy: 'KafkaTemplate send',
    plane: 'SASL/OAUTHBEARER login callback',
  },
  {
    client: 'payment-consumer',
    audience: 'kafka',
    usedBy: '@KafkaListener',
    plane: 'SASL/OAUTHBEARER login callback',
  },
  {
    client: 'kafka-broker',
    audience: 'kafka',
    usedBy: 'Inter-broker + admin CLI',
    plane: 'Broker login + super.users',
  },
] as const;

export const E2E_SEQUENCE: FlowStep[] = [
  {
    step: 1,
    actor: 'ACT 1 · Caller',
    method: 'POST',
    endpoint: '/oauth2/{apiAs}/v1/token',
    detail: 'Token A as payment-api. aud=payment-api. This token never goes to Kafka.',
  },
  {
    step: 2,
    actor: 'ACT 1 · API',
    method: 'POST',
    endpoint: '/api/payments',
    detail: 'Spring Security: JWT + payment:write. Missing token → 401. Wrong scope → 403. Kafka not involved yet.',
  },
  {
    step: 3,
    actor: 'ACT 2 · PaymentProducer',
    method: 'POST',
    endpoint: '/oauth2/{kafkaAs}/v1/token',
    detail: 'Token B as payment-producer. Different authorization server. aud=kafka.',
  },
  {
    step: 4,
    actor: 'ACT 2 · Kafka Broker',
    method: 'TLS+SASL+ACL',
    endpoint: 'WRITE payments',
    detail: 'TLS (real broker?) → SASL JWT (who am I?) → ACL WRITE (may I?). Then 202. Deny ACL → 403, not DLT.',
  },
  {
    step: 5,
    actor: 'ACT 3 · PaymentConsumer',
    method: 'POST',
    endpoint: '/oauth2/{kafkaAs}/v1/token',
    detail: 'Token C as payment-consumer. Same kafka authorization server, different client.',
  },
  {
    step: 6,
    actor: 'ACT 3 · Kafka Broker',
    method: 'ACL',
    endpoint: 'READ topic + READ group',
    detail: 'Topic READ is not enough. Join/commit needs group payment-service. Then the message arrives.',
  },
];

export const PRODUCER_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'Producer', method: 'TLS', endpoint: 'SASL_SSL://:9093', detail: 'Verify broker cert via truststore.'},
  {step: 2, actor: 'Login callback', method: 'POST', endpoint: '/token', detail: 'clientId=payment-producer, audience kafka.'},
  {step: 3, actor: 'Broker', method: 'SASL', endpoint: 'OAUTHBEARER', detail: 'Validate JWT. Principal User:payment-producer.'},
  {step: 4, actor: 'ACL', method: 'WRITE', endpoint: 'topic payments', detail: 'Allow → produce. Deny → TopicAuthorizationException.'},
];

export const CONSUMER_SEQUENCE: FlowStep[] = [
  {step: 1, actor: 'Consumer', method: 'POST', endpoint: '/token', detail: 'client_credentials payment-consumer.'},
  {step: 2, actor: 'Broker', method: 'SASL', endpoint: 'OAUTHBEARER', detail: 'Principal User:payment-consumer.'},
  {step: 3, actor: 'ACL', method: 'READ', endpoint: 'topic payments', detail: 'Topic permission is not enough to join a group.'},
  {step: 4, actor: 'ACL', method: 'READ', endpoint: 'group payment-service', detail: 'Missing group ACL → GroupAuthorizationException. Log KAFKA_SECURITY_DENIED; do not DLT.'},
  {step: 5, actor: 'Listener', method: 'POLL', endpoint: 'payments', detail: '@KafkaListener processes PaymentEvent.'},
];
