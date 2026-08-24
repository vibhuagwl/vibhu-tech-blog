import type {Metadata} from 'next';
import JavaReentrantLockHub from '@/components/java-reentrant-lock/java-reentrant-lock-hub';

export const metadata: Metadata = {
  title: 'ReentrantLock & ReadWriteLock — Principal FinTech Playbook',
  description:
    'Implementation-focused Java locking: ReentrantLock, ReentrantReadWriteLock, StampedLock, AQS, Condition, fairness, tryLock, upgrade traps, deadlocks, Spring, and multi-JVM limits — for financial systems interviews.',
};

export default function JavaReentrantLockPage() {
  return (
    <main>
      <JavaReentrantLockHub />
    </main>
  );
}
