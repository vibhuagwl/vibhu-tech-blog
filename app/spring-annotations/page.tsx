import type {Metadata} from 'next';
import SpringAnnotationsHub from '@/components/spring-annotations/spring-annotations-hub';

export const metadata: Metadata = {
  title: 'Spring Annotations — Inventory + Internals Interview Mastery',
  description:
    'Enterprise Spring/Boot annotation encyclopedia for Staff interviews: master inventory, processors, proxies, Test slices, Actuator, Data, Kafka, Security — Boot 3 / Framework 6.',
};

export default function SpringAnnotationsPage() {
  return (
    <main>
      <SpringAnnotationsHub />
    </main>
  );
}
