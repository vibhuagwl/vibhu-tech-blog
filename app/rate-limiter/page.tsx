import type {Metadata} from 'next';
import {Suspense} from 'react';
import RateLimiterHub from '@/components/rate-limiter/rate-limiter-hub';
import {buildSpringRateLimiterLabTree, listSpringRateLimiterLabFiles} from '@/lib/spring-rate-limiter-lab-source';

export const metadata: Metadata = {
  title: 'Rate Limiter — End-to-End HLD + LLD Staff/Principal Interview Master',
  description:
    'Complete distributed rate limiter interview guide: problem story, algorithms, HLD/LLD, Redis Lua atomicity, AWS, hot keys, multi-region, 16 incidents, 50+ prompts, Spring lab on :8098.',
};

export default function RateLimiterPage() {
  const files = listSpringRateLimiterLabFiles();
  const tree = buildSpringRateLimiterLabTree(files);
  const defaultPath =
    files.find((f) => f.path === 'README.md')?.path
    ?? files.find((f) => f.path.includes('PlaygroundController.java'))?.path
    ?? files.find((f) => f.path.includes('TokenBucketRateLimiter.java'))?.path
    ?? files.find((f) => f.path.includes('token_bucket.lua'))?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading rate limiter guide...</div>}>
        <RateLimiterHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
