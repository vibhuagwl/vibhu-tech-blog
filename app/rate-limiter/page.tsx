import type {Metadata} from 'next';
import {Suspense} from 'react';
import RateLimiterHub from '@/components/rate-limiter/rate-limiter-hub';
import {buildSpringRateLimiterLabTree, listSpringRateLimiterLabFiles} from '@/lib/spring-rate-limiter-lab-source';

export const metadata: Metadata = {
  title: 'Distributed Rate Limiter — Token Bucket, Redis Lua, Spring Interview Deep Dive',
  description:
    'Staff-level distributed rate limiting: token bucket vs sliding windows, Redis Lua atomicity, multi-level quotas, fail-open vs fail-closed, Java/Spring lab on port 8098.',
};

export default function RateLimiterPage() {
  const files = listSpringRateLimiterLabFiles();
  const tree = buildSpringRateLimiterLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('token_bucket.lua'))?.path
    ?? files.find((f) => f.path.includes('TokenBucketRateLimiter.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
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
