import type {Metadata} from 'next';
import DistributedLockHub from '@/components/distributed-lock/distributed-lock-hub';

export const metadata: Metadata = {
  title: 'Distributed Locking — Spring Boot Architect Interview',
  description:
    'Visual, code-first distributed locking: Redis SET NX PX, Redisson, DB FOR UPDATE, ZooKeeper, fencing tokens, banking debit races for Staff/Principal interviews.',
};

export default function DistributedLockingPage() {
  return (
    <main>
      <DistributedLockHub />
    </main>
  );
}
