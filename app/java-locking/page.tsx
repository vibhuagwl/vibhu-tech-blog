import type {Metadata} from 'next';
import JavaLockingHub from '@/components/java-locking/java-locking-hub';

export const metadata:Metadata={
  title:'Java Locking & Concurrency',
  description:
    'Practical Java locking handbook for Staff/Principal interviews: synchronized, ReentrantLock, StampedLock, atomics, latches, ConcurrentHashMap, deadlock, DB vs distributed locks — broken vs fixed code and diagrams.',
};

export default function JavaLockingPage(){
  return (
    <main>
      <JavaLockingHub/>
    </main>
  );
}
