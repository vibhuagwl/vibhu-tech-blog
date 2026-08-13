import type {Metadata} from 'next';
import JavaVersionsHub from '@/components/java-versions/java-versions-hub';

export const metadata:Metadata={
  title:'Java Version Evolution',
  description:
    'Java 8 → 11 → 17 → 21 → 25 evolution guide for Staff, Principal, and Architect interviews: features, JVM, concurrency, virtual threads, migration playbooks, and production risks. Java 25 status verified against OpenJDK.',
};

export default function JavaVersionsPage(){
  return (
    <main>
      <JavaVersionsHub/>
    </main>
  );
}
