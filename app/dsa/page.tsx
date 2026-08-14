import type {Metadata} from 'next';
import DsaHub from '@/components/dsa/dsa-hub';

export const metadata: Metadata = {
  title: 'DSA — Number of Islands (BFS/DFS) and Sliding Window',
  description:
    'Interview catalog: Number of Islands family with DFS/BFS Java, plus a grouped sliding-window catalog with brute-force to optimized approaches and time/space complexity.',
};

export default function DsaPage() {
  return (
    <main>
      <DsaHub />
    </main>
  );
}
