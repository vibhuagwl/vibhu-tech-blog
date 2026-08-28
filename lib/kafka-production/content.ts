import type {TocItem} from './types';

export const KAFKA_PRODUCTION_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview · architecture'},
  {id: 'deployment', label: '01. KRaft deployment · listeners'},
  {id: 'tls', label: '02. TLS · mTLS · certificates'},
  {id: 'auth', label: '03. Authentication · SASL'},
  {id: 'acl', label: '04. Authorization · ACLs'},
  {id: 'producer', label: '05. Producer security'},
  {id: 'consumer', label: '06. Consumer security'},
  {id: 'secrets', label: '07. Secrets management'},
  {id: 'network', label: '08. Network security'},
  {id: 'topics', label: '09. Topic design · durability'},
  {id: 'eos', label: '10. Idempotence · EOS'},
  {id: 'failures', label: '11. Failure scenarios'},
  {id: 'dr', label: '12. Disaster recovery'},
  {id: 'monitoring', label: '13. Monitoring · alerts'},
  {id: 'k8s', label: '14. Kubernetes deployment'},
  {id: 'security-flow', label: '15. Security flow (18 steps)'},
  {id: 'comparison', label: '16. Security comparison table'},
  {id: 'repo', label: '17. Config repository explorer'},
  {id: 'cheatsheet', label: '18. Production checklist'},
];

export const MEMORY_SENTENCE =
  'Private network · SASL_SSL · SCRAM per service · ACL least privilege · acks=all · minISR=2 · RF=3 · idempotent producer · manual consumer commit · secrets in Vault · monitor URP/lag/certs.';

export const VERSION_NOTE =
  'FinTech production reference: kafka-production/ repo + this board. Deep internals: /kafka-cluster · /kafka-infra · Spring: /spring-security#kafka-security.';

export const ARCHITECTURE_ASCII = `
Producer                    Consumer Group
   |                              ^
   | SASL_SSL + TLS               | SASL_SSL + TLS
   v                              |
Private DNS / LB ──► Broker AZ-1 ◄──► Broker AZ-2 ◄──► Broker AZ-3
                         │                │                │
                         └──── RF=3 replicated topics ──────┘
Controller quorum (KRaft) — metadata only, not client traffic
`;

export const LISTENERS_EXPLAIN = `
listeners          = sockets the broker BINDS on this machine
advertised.listeners = addresses returned in metadata — must be reachable by clients
inter.broker.listener.name = BROKER listener for replica fetch (isolate from client traffic)
controller.listener.names  = KRaft quorum only — NEVER expose to applications

Example:
  CLIENT://0.0.0.0:9093   → apps connect here
  BROKER://0.0.0.0:9094   → replication only
  CONTROLLER://0.0.0.0:9095 → quorum only
`;

export const SECURITY_COMPARISON = {
  headers: ['Security', 'Encryption', 'Authentication', 'Authorization'],
  rows: [
    ['PLAINTEXT', '❌', '❌', '❌'],
    ['SSL/TLS', '✅', 'Server cert', 'ACL'],
    ['SASL_SSL', '✅', 'SASL (SCRAM/OAuth)', 'ACL'],
    ['mTLS', '✅', 'Client certificate', 'ACL'],
    ['mTLS + SASL', '✅', 'Cert + SASL', 'ACL'],
  ],
};

export const SECURITY_FLOW_STEPS = [
  'Producer starts — loads truststore + SCRAM creds from Secrets Manager',
  'TCP connect to bootstrap broker :9093',
  'TLS handshake — server presents broker certificate',
  'Client validates cert (truststore + hostname)',
  'SASL SCRAM-SHA-512 authentication',
  'Broker maps to User:payment-producer',
  'StandardAuthorizer evaluates ACL',
  'WRITE permission granted on payment-events',
  'Producer publishes (acks=all, idempotence=true)',
  'Leader replicates to ISR followers',
  'Consumer connects — TLS + SASL',
  'ACL: READ topic + READ consumer group',
  'Consumer joins payment-group',
  'Partition assignment (rebalance if needed)',
  'Fetch records from leader',
  'Idempotent processing + dedupe table',
  'Manual offset commit after DB transaction',
  'Audit log: auth success/failure events',
];

export const FAILURE_SCENARIOS = [
  {scenario: 'Producer cannot reach Kafka', handling: 'Outbox buffers in DB; retry with backoff; alert if lag grows'},
  {scenario: 'Broker 1 down', handling: 'Leader election from ISR; metadata refresh; no data loss if ISR≥minISR'},
  {scenario: '2 brokers down', handling: 'acks=all fails NOT_ENOUGH_REPLICAS; restore before retention loss'},
  {scenario: 'Consumer crash mid-process', handling: 'Manual ack — redelivery; dedupe table prevents double apply'},
  {scenario: 'Network partition', handling: 'Timeout + retry; CB on producer side; consumer max.poll.interval'},
  {scenario: 'ISR < min.insync.replicas', handling: 'Producer write fails — correct behavior; fix brokers not lower minISR'},
  {scenario: 'Cert expired', handling: 'Auth failures spike; rolling cert rotation with dual-trust window'},
  {scenario: 'ACL typo on deploy', handling: 'AuthorizationException; rollback deploy; audit log spike'},
];

export const PRODUCTION_CHECKLIST = [
  'KRaft mode — 3+ brokers across 3 AZs',
  'listeners: CLIENT / BROKER / CONTROLLER separated',
  'No PLAINTEXT in production',
  'SASL_SSL + SCRAM-SHA-512 (or mTLS + SASL for zero-trust)',
  'Separate SCRAM user per microservice',
  'ACL least privilege — no CLUSTER_ACTION for apps',
  'default.replication.factor=3, min.insync.replicas=2',
  'unclean.leader.election.enable=false',
  'enable.idempotence=true, acks=all on producers',
  'enable.auto.commit=false, manual ack on consumers',
  'Secrets in AWS Secrets Manager / Vault — not Git',
  'Certificate rotation runbook with dual-trust window',
  'Private subnets — NetworkPolicy / security groups',
  'Disk encryption (EBS gp3 encrypted / K8s storage class)',
  'Prometheus alerts: URP, offline partitions, lag, disk, cert expiry, auth failures',
  'Audit logging enabled — no secrets in logs',
  'DR cluster with MirrorMaker 2 + failover runbook',
  'Topic design: partition key = businessId for ordering',
];
