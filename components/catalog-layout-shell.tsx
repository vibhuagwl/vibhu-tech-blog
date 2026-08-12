'use client';

import {usePathname} from 'next/navigation';
import ProblemNav, {type ProblemNavConfig} from '@/components/problem-nav';
import type {NavPost} from '@/lib/posts';

function normalizePath(path:string){
  const trimmed=path.replace(/\/+$/,'');
  return trimmed || '/';
}

function isArticlePath(pathname:string,basePath:string){
  const path=normalizePath(pathname);
  const base=normalizePath(basePath);
  if(path===base) return false;
  return path.startsWith(`${base}/`);
}

export default function CatalogLayoutShell({
  posts,
  config,
  children,
}:{
  posts:NavPost[];
  config:ProblemNavConfig;
  children:React.ReactNode;
}){
  const pathname=usePathname() ?? '';
  const reading=isArticlePath(pathname,config.basePath);

  if(reading){
    return (
      <div className="reading-layout mx-auto max-w-[min(100%,72rem)] px-4 py-8 md:px-6 md:py-10">
        {children}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <ProblemNav posts={posts} config={config}/>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
