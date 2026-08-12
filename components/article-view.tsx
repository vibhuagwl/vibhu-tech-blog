import {notFound} from 'next/navigation';
import Link from 'next/link';
import {compileMDX} from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {getAllPosts,getPost,getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import {extractHeadings} from '@/lib/headings';
import {mdxComponents} from '@/components/mdx';
import ArticleToc from '@/components/article-toc';
import BackToTop from '@/components/back-to-top';
import TechnologySectionStrip from '@/components/technology-section-strip';
import {KAFKA_SIDEBAR_ORDER} from '@/lib/technology-hub';

type Section=keyof typeof SECTION_CATEGORIES;

const SECTION_LABEL:Record<Section,string>={
  'system-design':'System Design',
  'distributed-systems':'Distributed Systems',
  fintech:'FinTech',
  behavior:'Behavior',
  'leadership-principles':'Leadership Principles',
  complexity:'Complexity',
  'behavioral-interview':'Behavioral Interview',
  'kafka-interview':'Kafka',
  'redis-interview':'Redis Interview',
  'realtime-issues':'Real-Time Issues',
};

function sortSectionPosts<T extends {slug:string;title:string}>(posts:T[],section:Section){
  const list=posts.slice();
  if(section==='kafka-interview'){
    const rank=new Map(KAFKA_SIDEBAR_ORDER.map((slug,i)=>[slug,i]));
    return list.sort((a,b)=>{
      const ai=rank.has(a.slug)?rank.get(a.slug)!:Number.MAX_SAFE_INTEGER;
      const bi=rank.has(b.slug)?rank.get(b.slug)!:Number.MAX_SAFE_INTEGER;
      if(ai!==bi) return ai-bi;
      return a.title.localeCompare(b.title);
    });
  }
  return list.sort((a,b)=>a.title.localeCompare(b.title));
}

export function sectionStaticParams(section:Section){
  return getPostsByCategories([...SECTION_CATEGORIES[section]]).map((p)=>({slug:p.slug}));
}

export async function sectionMetadata(slug:string,basePath:string){
  const p=getPost(slug);
  return p
    ? {
        title:p.title,
        description:p.description,
        alternates:{canonical:`${basePath}/${p.slug}`},
        openGraph:{title:p.title,description:p.description,type:'article' as const},
      }
    : {};
}

export default async function ArticleView({
  slug,
  section,
  basePath,
}:{
  slug:string;
  section:Section;
  basePath:string;
}){
  const p=getPost(slug);
  const allowed=new Set<string>(SECTION_CATEGORIES[section]);
  if(!p || !allowed.has(p.category)) notFound();

  const sectionPosts=sortSectionPosts(
    getPostsByCategories([...SECTION_CATEGORIES[section]]),
    section,
  );
  const index=sectionPosts.findIndex((x)=>x.slug===p.slug);
  const prev=index>0?sectionPosts[index-1]:null;
  const next=index>=0 && index<sectionPosts.length-1?sectionPosts[index+1]:null;

  const headings=extractHeadings(p.content);

  const {content}=await compileMDX({
    source:p.content,
    components:mdxComponents,
    options:{
      mdxOptions:{
        remarkPlugins:[remarkGfm],
      },
    },
  });

  const related=sectionPosts
    .filter((x)=>x.slug!==p.slug && x.tags.some((t)=>p.tags.includes(t)))
    .slice(0,3);

  const fallbackRelated=related.length>0
    ? related
    : getAllPosts().filter((x)=>x.slug!==p.slug && x.tags.some((t)=>p.tags.includes(t))).slice(0,3);

  const sectionHref=basePath;
  const sectionLabel=SECTION_LABEL[section] ?? section;

  return (
    <main>
      <div className={headings.length>=2?'xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-8':''}>
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-blue-700">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href={sectionHref} className="hover:text-blue-700">{sectionLabel}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="truncate font-medium text-slate-700 dark:text-slate-300" aria-current="page">
                {p.title}
              </li>
            </ol>
          </nav>

          {section==='kafka-interview' && <TechnologySectionStrip technology="kafka"/>}

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
              {p.category} · {p.difficulty}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-[-.03em] text-slate-900 md:text-4xl dark:text-white">
              {p.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg md:leading-8 dark:text-slate-300">
              {p.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{p.readingTime}</span>
              <span aria-hidden="true">·</span>
              <span>{p.publishedAt}</span>
            </div>
            {p.tags.length>0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                {p.tags.map((tag)=>(
                  <li key={tag}>
                    <Link
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {headings.length>=2 && (
              <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 xl:hidden dark:border-slate-800 dark:bg-slate-900">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
                  On this page
                </summary>
                <ul className="mt-3 space-y-2">
                  {headings.map((h)=>(
                    <li key={h.id} className={h.level===3?'pl-3':''}>
                      <a href={`#${h.id}`} className="text-sm text-slate-600 hover:text-blue-700 dark:text-slate-300">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="prose-design mt-8 md:mt-10">{content}</div>
          </article>

          <nav aria-label="Adjacent articles" className="mt-8 grid gap-3 sm:grid-cols-2">
            {prev?(
              <Link
                href={`${basePath}/${prev.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">
                  <ArrowLeft size={14}/> Previous
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white">
                  {prev.title}
                </div>
              </Link>
            ):<div className="hidden sm:block"/>}
            {next && (
              <Link
                href={`${basePath}/${next.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 text-right transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">
                  Next <ArrowRight size={14}/>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white">
                  {next.title}
                </div>
              </Link>
            )}
          </nav>

          {fallbackRelated.length>0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold tracking-tight">Related guides</h2>
              <p className="mt-1 text-sm text-slate-500">Continue with adjacent interview topics.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {fallbackRelated.map((r)=>(
                  <Link
                    key={r.slug}
                    href={allowed.has(r.category)?`${basePath}/${r.slug}`:hrefForPost(r.category,r.slug)}
                    className="card p-5 transition hover:border-blue-200"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700 dark:text-blue-400">
                      {r.category}
                    </div>
                    <div className="mt-2 font-semibold text-slate-900 dark:text-white">{r.title}</div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{r.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {headings.length>=2 && <ArticleToc headings={headings}/>}
      </div>

      <BackToTop/>
    </main>
  );
}
