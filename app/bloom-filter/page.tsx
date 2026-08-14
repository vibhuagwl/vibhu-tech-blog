import type {Metadata} from 'next';
import {Suspense} from 'react';
import BloomFilterHub from '@/components/bloom-filter/bloom-filter-hub';
import {buildSpringBloomFilterLabTree, listSpringBloomFilterLabFiles} from '@/lib/spring-bloom-filter-lab-source';

export const metadata: Metadata = {
  title: 'Bloom Filter — Java, Spring Boot, System Design Interview Deep Dive',
  description:
    'Bloom filters from bits and math to Spring Boot cache penetration, Cassandra SSTables, Kafka idempotency, counting filters, and Staff/Principal interview answers.',
};

export default function BloomFilterPage() {
  const files = listSpringBloomFilterLabFiles();
  const tree = buildSpringBloomFilterLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('BloomFilter.java'))?.path
    ?? files.find((f) => f.path.includes('UserService.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Bloom Filter guide...</div>}>
        <BloomFilterHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
