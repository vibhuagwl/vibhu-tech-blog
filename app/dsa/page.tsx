import type {Metadata} from 'next';
import DsaHub from '@/components/dsa/dsa-hub';

export const metadata: Metadata = {
  title: 'DSA — Number of Islands (BFS/DFS) and Sliding Window',
  description:
    'Interview catalog: Number of Islands family with DFS/BFS Java, plus sliding window problem statements, patterns, and code.',
};

export default function DsaPage() {
  return (
    <main>
      <DsaHub />
    </main>
  );
}
