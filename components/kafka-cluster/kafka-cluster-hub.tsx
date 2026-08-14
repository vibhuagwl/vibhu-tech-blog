'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {KAFKA_CLUSTER_TOC} from '@/lib/kafka-cluster/toc';
import {
  ANTI,
  BROKER_LAYERS,
  BROKER_START,
  BROKER_STOP,
  CAPACITY,
  CHEATS,
  CLUSTER_PIECES,
  COMPACTION,
  CONFIG_CORE,
  CONTROLLER_DUTIES,
  ELECTION_FLOW,
  EPOCH_WHY,
  ISR_ROWS,
  KRAFT_ROWS,
  LISTENER_ROWS,
  MEMORY_SENTENCE,
  OFFSET_TYPES,
  PAGE_CACHE,
  PROTOCOL_APIS,
  RAFT_FLOW,
  REPLICA_ASSIGN,
  REQUEST_PATH,
  SCALE_ADD_BROKER,
  STORAGE_TREE,
  THREAD_ROWS,
  TOPIC_ROWS,
  VERSION_NOTE,
  ZERO_COPY,
} from '@/lib/kafka-cluster/content';
import {CHAOS, FAILURE_MATRIX, TROUBLESHOOT, WAR_LEADER_CRASH, WAR_QUORUM} from '@/lib/kafka-cluster/failures';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KafkaClusterHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Staff · Principal · KRaft · Broker Internals · Apache Kafka 4.x
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Kafka Cluster & Broker — Complete Board
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Cluster and broker only: KRaft, request path, partitions, replication, ISR, storage, page cache,
          failures, multi-AZ, capacity, quotas, security, ops, and Staff war games. Producer/consumer appear only
          when needed to explain the broker.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          {MEMORY_SENTENCE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{VERSION_NOTE}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Hub:{' '}
          <Link href="/kafka-interview" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Kafka
          </Link>
          {' · '}
          <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Producer board
          </Link>
          {' · '}
          <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Mastery
          </Link>
          {' · '}
          <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Internals
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={KAFKA_CLUSTER_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Kafka cluster fundamentals" lead="A cluster is brokers plus a metadata quorum. Partitions are the unit of everything that matters.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph kraft [KRaft controller quorum]
    C1[Controller]
    C2[Controller]
    C3[Controller]
  end
  subgraph data [Brokers]
    B1[Broker1 leader p0]
    B2[Broker2 follower p0]
    B3[Broker3 follower p0]
  end
  kraft --> data
  P[Producers] --> B1
  F[Consumers] --> B1
  B2 -->|fetch| B1
  B3 -->|fetch| B1`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['Piece', 'Meaning']} rows={CLUSTER_PIECES} />
            </div>
          </Section>

          <Section id="broker-arch" title="01. Broker internal architecture" lead="Data plane lives here. Control plane is KRaft — do not put the controller on the hot Produce path in your mental model.">
            <MiniTable headers={['Layer', 'Responsibility']} rows={BROKER_LAYERS} />
            <div className="mt-4">
              <CodePanel title="Inbound path" tone="ok" code={`Client → Socket → Acceptor → Processor
  → Request Queue → Request Handler
  → ReplicaManager → LogManager
  → Page Cache / Disk`} />
            </div>
          </Section>

          <Section id="threading" title="02. Broker threading model">
            <MiniTable headers={['Pool', 'Default (4.x)', 'Saturation signal']} rows={THREAD_ROWS} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              CPU saturation in network processors looks like connection latency. Saturation in I/O handlers looks
              like request queue growth and produce p99. Slow disks make followers leave ISR and handlers block —
              raising threads without fixing disks multiplies contention.
            </p>
          </Section>

          <Section id="kraft" title="03. KRaft architecture and Raft" lead="Kafka 4.x: ZooKeeper mode is gone. Metadata is a Raft-replicated log owned by controllers.">
            <MiniTable headers={['Topic', 'Fact']} rows={KRAFT_ROWS} />
            <div className="mt-4">
              <CodePanel title="Metadata commit path" tone="ok" code={RAFT_FLOW} />
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  L[Controller leader] -->|append| M[Metadata log]
  M --> F1[Controller follower]
  M --> F2[Controller follower]
  L -->|majority commit| Apply[Apply + publish]
  Apply --> B[Broker MetadataCache]`}
              />
            </div>
          </Section>

          <Section id="controller" title="04. Controller duties and broker registration">
            <MiniTable headers={['Duty', 'Notes']} rows={CONTROLLER_DUTIES} />
            <div className="mt-4">
              <CodePanel
                title="New broker join"
                code={`New broker process
 → connect to controller.quorum.voters
 → register node.id, listeners, rack, features
 → receive metadata snapshot/log
 → load local replicas
 → fence old epoch if restarting
 → become operational (still no auto partition steal)`}
              />
            </div>
          </Section>

          <Section id="lifecycle" title="05. Broker lifecycle — start, stop, crash">
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel title="Startup" tone="ok" code={BROKER_START} />
              <CodePanel title="Shutdown / crash" tone="danger" code={BROKER_STOP} />
            </div>
          </Section>

          <Section
            id="config"
            title="06. Broker configuration (must-override defaults)"
            lead="Lab defaults are not production. RF=1 and minISR=1 and auto.create=true are foot-guns."
          >
            <MiniTable headers={['Config', 'Type', 'Default', 'Prod note']} rows={CONFIG_CORE} />
          </Section>

          <Section id="listeners" title="07. Listeners and networking">
            <MiniTable headers={['Path', 'Detail']} rows={LISTENER_ROWS} />
          </Section>

          <Section id="request-path" title="08. Network request processing">
            <CodePanel title="Complete path" tone="ok" code={REQUEST_PATH} />
          </Section>

          <Section id="protocol" title="09. Wire protocol — broker view">
            <MiniTable headers={['API', 'Broker role']} rows={PROTOCOL_APIS} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              Deeper Produce/InitProducerId field lists live on the{' '}
              <Link href="/kafka-producer#protocol" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Producer board §26
              </Link>
              . Brokers additionally own Fetch for replica fetchers and Metadata serving.
            </p>
          </Section>

          <Section id="topics-parts" title="10. Topics, partitions, replica assignment">
            <MiniTable headers={['cleanup.policy', 'Use']} rows={TOPIC_ROWS} />
            <div className="mt-4">
              <CodePanel title="Replica assignment" tone="ok" code={REPLICA_ASSIGN} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Partitions are Kafka’s unit of ordering, parallelism, replication, and storage. Increasing partition
              count remaps new keys — historical records stay put. Decreasing is not a live shrink.
            </p>
          </Section>

          <Section id="replication" title="11. Replication, ISR, high watermark" lead="Replication is pull. Followers fetch. ISR is the durability set.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  L[Leader] --> Log[Local log LEO]
  F1[Follower] -->|Fetch| L
  F2[Follower] -->|Fetch| L
  Log --> HW[HW / ISR]
  HW --> C[Consumers]`}
              />
            </div>
            <div className="mt-4">
              <MiniTable headers={['ISR topic', 'Detail']} rows={ISR_ROWS} />
            </div>
            <div className="mt-4">
              <CodePanel title="LEO · HW · LSO" code={OFFSET_TYPES} />
            </div>
          </Section>

          <Section id="election" title="12. Leader election and leader epochs">
            <CodePanel title="Leader crash sequence" tone="ok" code={ELECTION_FLOW} />
            <div className="mt-4">
              <CodePanel title="Why leader epoch" code={EPOCH_WHY} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel title="Clean election" tone="ok" code={`Elect from ISR only
unclean.leader.election.enable=false
Prefer durability
May stay offline if ISR empty`} />
              <CodePanel title="Unclean election" tone="danger" code={`Elect out-of-ISR last resort
Availability over safety
Possible loss of unreplicated tail
Never default for payments`} />
            </div>
          </Section>

          <Section id="reassign" title="13. Partition reassignment and cluster balance">
            <CodePanel title="Why reassign" code={`Add/remove brokers
Fix disk imbalance
Evacuate a bad host
Move leaders (PLE) for traffic balance

Always throttle replication
Watch URP + ISR during the move
Nothing auto-balances on broker join`} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Balance across partitions, leaders, disk, network, CPU, and racks. A “balanced” replica count with
              all preferred leaders on two brokers is still a hotspot.
            </p>
          </Section>

          <Section id="storage" title="14. Storage — logs, segments, indexes">
            <CodePanel title="On disk" tone="ok" code={STORAGE_TREE} />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Lookup: offset → offset index → file position in segment → scan/read record. Time index supports
              timestamp searches. Transaction index supports txn abort/commit markers.
            </p>
          </Section>

          <Section id="pagecache" title="15. Page cache, JVM memory, zero-copy">
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel title="Page cache model" tone="ok" code={PAGE_CACHE} />
              <CodePanel title="Zero-copy (fetch)" code={ZERO_COPY} />
            </div>
          </Section>

          <Section id="retention" title="16. Retention and log compaction">
            <CodePanel
              title="Retention"
              code={`Time: retention.ms / log.retention.hours
Size: retention.bytes
Deletes closed segments — not byte-exact at the second
Check interval: log.retention.check.interval.ms`}
            />
            <div className="mt-4">
              <CodePanel title="Compaction" code={COMPACTION} />
            </div>
          </Section>

          <Section id="disk" title="17. Disk architecture and disk failure">
            <CodePanel
              title="log.dirs JBOD"
              tone="ok"
              code={`log.dirs=/disk1,/disk2,/disk3
Prefer multiple volumes over one RAID-0 for Kafka
Disk full / slow / corrupt → partitions on that dir suffer
ISR shrinks; leaders move if possible
Alert disk % and disk latency — not only CPU`}
            />
          </Section>

          <Section id="failures" title="18. Failure matrix">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
                  <tr>
                    {['Failure', 'Detection', 'Controller', 'Leader', 'ISR', 'Clients', 'Loss risk', 'Recovery'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAILURE_MATRIX.map((r) => (
                    <tr key={r[0]} className="border-t border-slate-200 dark:border-slate-800">
                      {r.map((c, i) => (
                        <td key={i} className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="az-rack" title="19. Multi-AZ and rack awareness" lead="RF=3 does not mean AZ-safe unless replicas are placed on different racks.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  subgraph aza [AZ-a]
    B1[B1]
  end
  subgraph azb [AZ-b]
    B2[B2]
  end
  subgraph azc [AZ-c]
    B3[B3]
  end
  B1 --- B2
  B2 --- B3
  B3 --- B1`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Set <code>broker.rack</code>, use rack-aware replica assignment, minISR=2 with RF=3 so one AZ can die
              and produces still succeed. Controllers also spread across AZs. After AZ recovery, preferred leader
              election rebalances produce traffic.
            </p>
          </Section>

          <Section id="capacity" title="20. Capacity planning and scaling">
            <CodePanel title="Formulas" tone="ok" code={CAPACITY} />
            <div className="mt-4">
              <CodePanel title="Add a broker" code={SCALE_ADD_BROKER} />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Scale up (bigger disks/NICs) vs scale out (more brokers). Partition count drives consumer
              parallelism but also FD count, recovery time, and controller load — “more partitions = more
              throughput” is incomplete.
            </p>
          </Section>

          <Section id="quotas" title="21. Quotas and control-plane pressure">
            <CodePanel
              title="Quotas"
              code={`producer_byte_rate / consumer_byte_rate / request_percentage
Entities: client-id, user, user+client
Throttle → throttle_time_ms in responses
Replication throttle during reassignment protects ISR

Control plane: topic create storms, flapping brokers,
huge partition counts → controller CPU / metadata lag`}
            />
          </Section>

          <Section id="security" title="22. Broker security">
            <CodePanel
              title="Hardening path"
              tone="ok"
              code={`Client → TLS → SASL → AuthN → ACL AuthZ → Broker

ACLs: WRITE, READ, CREATE, DELETE, ALTER, DESCRIBE,
CLUSTER_ACTION, IDEMPOTENT_WRITE, ALTER_CONFIGS

Rotate certs with overlap; fix advertised.listeners
Expired cert / ACL deny / SCRAM fail → connection or authorize errors`}
            />
          </Section>

          <Section id="monitoring" title="23. Monitoring and alerts">
            <CodePanel
              title="Critical signals"
              tone="danger"
              code={`P0: OfflinePartitionsCount, ActiveControllerCount unhealthy,
     disk full, broker down, quorum majority loss
P1: UnderReplicatedPartitions, IsrShrinksPerSec storm,
     RequestHandlerAvgIdle low, disk latency, produce p99
P2: leader imbalance, cleaner backlog, quota throttle

Also: BytesIn/Out, MessagesIn, NetworkProcessorAvgIdle,
LogFlushTime, JVM GC, replica fetcher lag`}
            />
            <div className="mt-4 space-y-3">
              {TROUBLESHOOT.slice(0, 8).map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Symptoms:</strong> {t.symptoms}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Causes:</strong> {t.causes}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Fix:</strong> {t.fix}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">More playbooks in §26 chaos and the interview deck.</p>
          </Section>

          <Section id="ops" title="24. Ops — upgrade, CLI, Kubernetes">
            <div className="grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Rolling restart / upgrade"
                tone="ok"
                code={`controlled.shutdown.enable=true
One broker at a time
Wait URP=0 + ISR healthy
Follow official feature-level upgrade path
Canary first; know rollback limits`}
              />
              <CodePanel
                title="CLI toolkit"
                code={`kafka-topics / kafka-configs
kafka-reassign-partitions
kafka-leader-election
kafka-metadata / kafka-cluster
kafka-storage (format — dangerous)
Never format a live prod log.dir casually`}
              />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Kubernetes: StatefulSet + PV per broker, topology spread across zones, headless service, correct{' '}
              <code>advertised.listeners</code>, anti-affinity so two brokers don’t share a node. Resource limits
              that starve page cache will look like “mysterious” disk latency.
            </p>
          </Section>

          <Section id="source" title="25. Source-level flows (names to say in interviews)">
            <CodePanel
              title="Produce"
              tone="ok"
              code={`ProduceRequest
 → Processor / KafkaRequestHandler
 → ReplicaManager.appendRecords
 → Partition.append / UnifiedLog.append
 → LogSegment + indexes
 → maybe wait ISR for acks=all
 → ProduceResponse`}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CodePanel
                title="Replication"
                code={`ReplicaFetcherThread
 → Fetch from leader
 → append to follower log
 → update LEO
 → leader includes in ISR when caught up
 → HW advances`}
              />
              <CodePanel
                title="Controller"
                code={`QuorumController
 → metadata log Raft
 → commit
 → MetadataPublisher
 → broker MetadataCache
Classes: ReplicaManager, UnifiedLog,
LogSegment, LogCleaner, SocketServer`}
              />
            </div>
          </Section>

          <Section id="chaos" title="26. Chaos and war games">
            <MiniTable headers={['Inject', 'Expected']} rows={CHAOS} />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <CodePanel title="Leader crash after write" tone="danger" code={WAR_LEADER_CRASH} />
              <CodePanel title="Controller quorum loss" tone="danger" code={WAR_QUORUM} />
            </div>
            <div className="mt-4 space-y-3">
              {TROUBLESHOOT.slice(8).map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <strong>Symptoms:</strong> {t.symptoms} · <strong>Fix:</strong> {t.fix}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="design" title="27. Production designs and anti-patterns">
            <CodePanel
              title="Financial 100k+/s multi-AZ sketch"
              tone="ok"
              code={`Brokers: 6–9 across 3 AZs (math from bytes×RF)
Controllers: 3 dedicated across AZs
RF=3, minISR=2, unclean=false, auto.create=false
JBOD NVMe, headroom 30%+
acks=all producers + idempotence
Rack-aware assignment
Quotas on noisy tenants
MM2/linking for DR — not stretched RF
Dashboards: URP, offline, ISR, disk, idle%, p99`}
            />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {ANTI.map((a) => (
                <div key={a.bad} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
                    <strong>Wrong:</strong> {a.bad}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                    <strong>Right:</strong> {a.good}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="interview" title="28. Interview drills and cheat sheets">
            <InterviewMode />
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <CodePanel title="Mental model" tone="ok" code={CHEATS.mental} />
              <CodePanel title="ISR" code={CHEATS.isr} />
              <CodePanel title="Election" code={CHEATS.election} />
              <CodePanel title="Storage" code={CHEATS.storage} />
              <CodePanel title="Interview hit list" code={CHEATS.interview} />
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  CL[KAFKA CLUSTER] --> KQ[KRaft quorum]
  CL --> BR[Brokers]
  KQ --> ML[Metadata log]
  BR --> P[Partitions]
  P --> L[Leader replica]
  L --> F1[Follower]
  L --> F2[Follower]
  F1 --> ISR[ISR]
  F2 --> ISR
  ISR --> HW[High watermark]
  L --> SEG[Log segments + indexes]
  SEG --> PC[Page cache]
  PC --> DISK[Disk]`}
              />
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-500">
              Next:{' '}
              <Link href="/kafka-producer" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Producer board
              </Link>
              {' · '}
              <Link href="/kafka-mastery" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Interview mastery
              </Link>
              {' · '}
              <Link href="/kafka-internals" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
                Internals
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
