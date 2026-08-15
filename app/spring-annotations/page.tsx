import type {Metadata} from 'next';
import SpringAnnotationsHub from '@/components/spring-annotations/spring-annotations-hub';

export const metadata: Metadata = {
  title: 'Spring Boot Annotations — Internals & Interview Masterclass (15+ YOE)',
  description:
    'Staff/Principal Spring annotation masterclass: annotation → metadata → processor → BeanDefinition → lifecycle → proxy → runtime. Boot 3 / SF 6, diagrams, incidents, interview simulator.',
};

export default function SpringAnnotationsPage() {
  return (
    <main>
      <SpringAnnotationsHub />
    </main>
  );
}
