import type {Metadata} from 'next';
import SpringAnnotationsHub from '@/components/spring-annotations/spring-annotations-hub';

export const metadata: Metadata = {
  title: 'Spring Annotations — Ecosystem Inventory + Internals',
  description:
    'Staff/Architect Spring annotation encyclopedia: version-aware inventory, ownership (Spring vs Jakarta), coverage audit, Boot 3/SF 6, Cloud/Batch/Integration, processors & proxies.',
};

export default function SpringAnnotationsPage() {
  return (
    <main>
      <SpringAnnotationsHub />
    </main>
  );
}
