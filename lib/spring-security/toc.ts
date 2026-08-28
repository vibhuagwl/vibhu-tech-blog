import type {TocItem} from './types';

export const SECURITY_TOC: TocItem[] = [
  {id: 'master-map', label: 'Security master map', group: 'Overview'},
  {id: 'cheat-sheet', label: 'Interview cheat sheet', group: 'Overview'},
  {id: 'stack-ladder', label: 'HTTP → AWS stack', group: 'Overview'},
  {id: 'labs', label: 'Runnable labs (existing)', group: 'Overview'},
  {id: 'interview-memory', label: 'Interview memory', group: 'Overview'},

  {id: 'http-internal', label: 'HTTP internal working', group: 'Network'},
  {id: 'http-vs-https', label: 'HTTP vs HTTPS', group: 'Network'},
  {id: 'tls', label: 'TLS 1.3 handshake', group: 'Network'},
  {id: 'mtls', label: 'TLS vs mTLS', group: 'Network'},
  {id: 'spring-tls', label: 'Spring Boot TLS', group: 'Network'},
  {id: 'spring-mtls', label: 'Spring Boot mTLS', group: 'Network'},
  {id: 'keystore-truststore', label: 'Keystore vs truststore', group: 'Network'},
  {id: 'keytool', label: 'keytool commands', group: 'Network'},
  {id: 'rest-client-mtls', label: 'RestClient mTLS', group: 'Network'},

  {id: 'symmetric', label: 'Symmetric encryption', group: 'Crypto'},
  {id: 'asymmetric', label: 'Asymmetric encryption', group: 'Crypto'},
  {id: 'hybrid', label: 'Hybrid / envelope', group: 'Crypto'},
  {id: 'hash-encoding', label: 'Hash vs encrypt vs encode', group: 'Crypto'},
  {id: 'digital-signature', label: 'Digital signature', group: 'Crypto'},
  {id: 'certificates', label: 'X.509 / CA chain', group: 'Crypto'},
  {id: 'password-security', label: 'Password hashing', group: 'Crypto'},

  {id: 'authn-authz', label: 'Authn vs authz', group: 'Application'},
  {id: 'jwt', label: 'JWT resource server', group: 'Application'},
  {id: 'oauth-oidc', label: 'OAuth2 + OIDC + PKCE', group: 'Application'},
  {id: 'saml', label: 'SAML', group: 'Application'},
  {id: 'rbac-abac', label: 'RBAC / ABAC / scopes', group: 'Application'},
  {id: 'filter-chain', label: 'Spring Security filters', group: 'Application'},
  {id: 'csrf', label: 'CSRF', group: 'Application'},
  {id: 'cors', label: 'CORS', group: 'Application'},
  {id: 'xss', label: 'XSS', group: 'Application'},
  {id: 'sqli', label: 'SQL injection', group: 'Application'},
  {id: 'ssrf', label: 'SSRF', group: 'Application'},
  {id: 'replay', label: 'Replay attacks', group: 'Application'},
  {id: 'mitm', label: 'MITM', group: 'Application'},
  {id: 'security-headers', label: 'Security headers', group: 'Application'},

  {id: 'api-security', label: 'API security layers', group: 'API'},
  {id: 'rate-limit-ddos', label: 'Rate limit / DDoS', group: 'API'},

  {id: 'aws-security', label: 'AWS security architecture', group: 'Cloud'},
  {id: 'aws-kms', label: 'AWS KMS envelope', group: 'Cloud'},
  {id: 'aws-secrets', label: 'AWS Secrets Manager', group: 'Cloud'},
  {id: 'aws-acm', label: 'ACM / ALB TLS', group: 'Cloud'},

  {id: 'kafka-security', label: 'Kafka TLS / SASL / ACL (deep dive)', group: 'Messaging'},
  {id: 'db-security', label: 'Database TLS', group: 'Data'},

  {id: 'zero-trust', label: 'Zero Trust', group: 'Architecture'},
  {id: 'observability', label: 'Security observability', group: 'Architecture'},
  {id: 'payment-e2e', label: 'Secure payment system', group: 'Architecture'},

  {id: 'comparisons', label: 'Comparison tables', group: 'Interview'},
  {id: 'interview-qa', label: 'Interview Q&A', group: 'Interview'},
];

export const VERSION_NOTE =
  'Spring Boot 3.4 · Spring Security 6.4 · Java 21. ~90% code/config/commands · ~10% theory. Labs: /spring-jwt-demo · /oauth-jwt-demo · /encryption · sibling: /api-gateway · /resilience4j';
