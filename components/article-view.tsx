import {notFound} from 'next/navigation';
import Link from 'next/link';
import {compileMDX} from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {getAllPosts,getPost,getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';
import {extractHeadings} from '@/lib/headings';
import {pickQuickNav} from '@/lib/article-meta';
import {mdxComponents} from '@/components/mdx';
import ArticleToc from '@/components/article-toc';
import ArticleQuickNav from '@/components/article-quick-nav';
import DifficultyBadge from '@/components/difficulty-badge';
import BackToTop from '@/components/back-to-top';
import JpmcSectionStrip from '@/components/jpmc-section-strip';
import TechnologySectionStrip from '@/components/technology-section-strip';
import {JPMC_SIDEBAR_ORDER} from '@/lib/jpmc-hub';
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
  'jpmc-experience':'JPMC Experience',
};

function sortSectionPosts<T extends {slug:string;title:string}>(posts:T[],section:Section){
  const list=posts.slice();
  const order=
    section==='jpmc-experience'?JPMC_SIDEBAR_ORDER
    :section==='kafka-interview'?KAFKA_SIDEBAR_ORDER
    :null;
  if(order){
    const rank=new Map(order.map((slug,i)=>[slug,i]));
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
  const quickNav=pickQuickNav(headings);

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
  const interviewHeading=headings.find((h)=>/interview answer|how i would answer|30-second|2-minute/i.test(h.text));
  const takeawaysHeading=headings.find((h)=>/takeaway/i.test(h.text));

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

          {section==='jpmc-experience' && <JpmcSectionStrip/>}
          {section==='kafka-interview' && <TechnologySectionStrip technology="kafka"/>}

          <article className="article-shell">
            <header className="article-header">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow">{p.category}</span>
                <DifficultyBadge difficulty={p.difficulty}/>
              </div>
              <h1 className="article-title">{p.title}</h1>
              <p className="article-dek">{p.description}</p>
              <div className="article-meta">
                <span>{p.readingTime}</span>
                <span aria-hidden="true">·</span>
                <span>{p.publishedAt}</span>
              </div>
              {p.tags.length>0 && (
                <ul className="article-tags" aria-label="Tags">
                  {p.tags.map((tag)=>(
                    <li key={tag}>
                      <Link href={`/search?q=${encodeURIComponent(tag)}`}>{tag}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </header>

            <aside className="tldr" aria-label="Summary">
              <div className="tldr__label">TL;DR</div>
              <p className="tldr__text">{p.description}</p>
              <ol className="tldr__flow">
                <li>Understand the problem</li>
                <li>Learn the trade-offs</li>
                <li>Tell the production story</li>
                <li>Practice the interview answer</li>
              </ol>
              {(interviewHeading || takeawaysHeading) && (
                <div className="tldr__actions">
                  {interviewHeading && (
                    <a href={`#${interviewHeading.id}`}>Jump to interview answer</a>
                  )}
                  {takeawaysHeading && (
                    <a href={`#${takeawaysHeading.id}`}>Jump to takeaways</a>
                  )}
                </div>
              )}
            </aside>

            <ArticleQuickNav items={quickNav}/>

            {headings.length>=2 && (
              <details className="mobile-toc xl:hidden">
                <summary>On this page</summary>
                <ul>
                  {headings.map((h)=>(
                    <li key={h.id} className={h.level===3?'pl-3':''}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="prose-design article-body">{content}</div>
          </article>

          <nav aria-label="Adjacent articles" className="article-adjacent">
            {prev?(
              <Link href={`${basePath}/${prev.slug}`} className="article-adjacent__link">
                <span className="article-adjacent__dir">
                  <ArrowLeft size={14}/> Previous
                </span>
                <span className="article-adjacent__title">{prev.title}</span>
              </Link>
            ):<div className="hidden sm:block"/>}
            {next && (
              <Link href={`${basePath}/${next.slug}`} className="article-adjacent__link article-adjacent__link--next">
                <span className="article-adjacent__dir">
                  Next <ArrowRight size={14}/>
                </span>
                <span className="article-adjacent__title">{next.title}</span>
              </Link>
            )}
          </nav>

          {fallbackRelated.length>0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                If you understand this, learn next
              </h2>
              <p className="mt-1 text-sm text-slate-500">Related interview topics in this learning graph.</p>
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
