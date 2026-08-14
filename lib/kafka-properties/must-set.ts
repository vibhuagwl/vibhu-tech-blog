import type {MustSetRow} from './types';

export const MUST_SET_PRODUCER: MustSetRow[] = [
  {property: 'acks', target: 'all', why: 'Durability with ISR'},
  {property: 'enable.idempotence', target: 'true', why: 'Safe retries'},
  {property: 'retries / delivery.timeout.ms', target: 'high / sized', why: 'Transient blips'},
  {property: 'linger.ms / batch.size / compression.type', target: 'tuned / zstd or lz4', why: 'Throughput'},
  {property: 'max.in.flight.requests.per.connection', target: '≤5 with idempotence', why: 'Ordering + EOS'},
  {property: 'transactional.id (if EOS)', target: 'stable per instance', why: 'Fencing'},
];

export const MUST_SET_CONSUMER: MustSetRow[] = [
  {property: 'enable.auto.commit', target: 'false', why: 'Commit after business success'},
  {property: 'auto.offset.reset', target: 'earliest / latest / none', why: 'Predictable start'},
  {property: 'isolation.level', target: 'read_committed if tx upstream', why: 'LSO visibility'},
  {property: 'max.poll.records / max.poll.interval.ms', target: 'sized together', why: 'Avoid rebalance storms'},
  {property: 'session.timeout.ms / heartbeat.interval.ms', target: 'classic protocol', why: 'Liveness'},
  {property: 'partition.assignment.strategy', target: 'CooperativeSticky', why: 'Smoother rolls'},
  {property: 'group.instance.id', target: 'stable on k8s', why: 'Fewer restart rebalances'},
];

export const MUST_SET_BROKER: MustSetRow[] = [
  {property: 'auto.create.topics.enable', target: 'false', why: 'No typo topics'},
  {property: 'default.replication.factor / min.insync.replicas', target: '3 / 2 typical', why: 'Durability with acks=all'},
  {property: 'unclean.leader.election.enable', target: 'false', why: 'No silent loss'},
  {property: 'advertised.listeners', target: 'reachable DNS', why: 'Classic k8s foot-gun'},
  {property: 'process.roles / controller.quorum.voters / node.id', target: 'KRaft set', why: 'Metadata quorum'},
  {property: 'log.retention.*', target: 'business window', why: 'Replay horizon'},
  {property: 'offsets.topic.replication.factor / transaction.state.log.replication.factor', target: '≥3', why: 'Internal topic HA'},
];

export const INTERACT_SNIPPET = `Producer: acks=all + enable.idempotence=true + max.in.flight≤5 + retries>0
Consumer: max.poll.records × process_time < max.poll.interval.ms
Broker:   message.max.bytes ≥ client max.request.size
          replica.fetch.max.bytes ≥ message.max.bytes
KRaft:    odd controller.quorum.voters; majority alive for metadata commits
group.protocol=consumer → broker-side assignors; classic timeouts may not apply`;

export const GO_NOGO = [
  'Producer: idempotence + acks=all + batching/compression verified',
  'Consumer: manual commit + poll budget + retry/DLQ for poison',
  'Broker: auto-create off, RF/minISR, unclean=false, retention set',
  'Controller: odd quorum across AZs; monitor ActiveControllerCount / metadata health',
  'Security: SASL/SSL + ACLs from app pods',
  'Replay: earlier offset without double settlement (idempotent sink)',
];

export const SPRING_MAP: {spring: string; kafka: string}[] = [
  {spring: 'spring.kafka.bootstrap-servers', kafka: 'bootstrap.servers'},
  {spring: 'spring.kafka.producer.acks', kafka: 'acks'},
  {spring: 'spring.kafka.producer.properties.*', kafka: 'pass-through producer configs'},
  {spring: 'spring.kafka.consumer.group-id', kafka: 'group.id'},
  {spring: 'spring.kafka.consumer.enable-auto-commit', kafka: 'enable.auto.commit'},
  {spring: 'spring.kafka.consumer.properties.*', kafka: 'pass-through consumer configs'},
  {spring: 'spring.kafka.consumer.auto-offset-reset', kafka: 'auto.offset.reset'},
  {spring: 'spring.kafka.listener.ack-mode', kafka: 'Spring ack vs Kafka commit model'},
];

export const TOPIC_COMMON: {property: string; use: string}[] = [
  {property: 'retention.ms / retention.bytes', use: 'Time/size retention'},
  {property: 'cleanup.policy', use: 'delete, compact, or both'},
  {property: 'min.insync.replicas', use: 'Topic durability override'},
  {property: 'segment.bytes / segment.ms', use: 'Segment roll'},
  {property: 'max.message.bytes', use: 'Per-topic size cap'},
  {property: 'compression.type', use: 'Topic default compression'},
  {property: 'unclean.leader.election.enable', use: 'Prefer leave false'},
  {property: 'message.timestamp.type', use: 'CreateTime vs LogAppendTime'},
];

export const DOCS = {
  producer: 'https://kafka.apache.org/40/configuration/producer-configs/',
  consumer: 'https://kafka.apache.org/40/configuration/consumer-configs/',
  broker: 'https://kafka.apache.org/40/configuration/broker-configs/',
  topic: 'https://kafka.apache.org/40/configuration/topic-level-configs/',
};
