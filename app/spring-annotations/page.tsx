import type {Metadata} from 'next';
import SpringAnnotationsHub from '@/components/spring-annotations/spring-annotations-hub';

export const metadata: Metadata = {
  title: 'Spring Annotations — Internals Interview Mastery',
  description:
    'Staff/Architect Spring Framework 6 / Boot 3 guide: processors, BeanPostProcessors, proxies, @Transactional self-invocation, auto-config, Kafka, Security — not a cheat sheet.',
};

export default function SpringAnnotationsPage() {
  return (
    <main>
      <SpringAnnotationsHub />
    </main>
  );
}
