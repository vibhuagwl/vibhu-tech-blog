import type {Metadata} from 'next';
import DbShardingHub from '@/components/db-sharding/db-sharding-hub';

export const metadata: Metadata = {
  title: 'Database Partitioning & Sharding — Java / Spring / AWS Architect Interview',
  description:
    'Visual partitioning & sharding masterclass: PostgreSQL/MySQL partitions, MongoDB/Cassandra/DynamoDB keys, Spring AbstractRoutingDataSource, consistent hashing, cross-shard TX, AWS DR, RPO/RTO.',
};

export default function DbShardingPage() {
  return (
    <main>
      <DbShardingHub />
    </main>
  );
}
