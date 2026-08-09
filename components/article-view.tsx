import {notFound} from 'next/navigation';
import Link from 'next/link';
import {compileMDX} from 'next-mdx-remote/rsc';
import {getAllPosts,getPost,getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';
import {mdxComponents} from '@/components/mdx';

type Section=keyof typeof SECTION_CATEGORIES;

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

  const {content}=await compileMDX({source:p.content,components:mdxComponents});
  const related=getPostsByCategories([...SECTION_CATEGORIES[section]])
    .filter((x)=>x.slug!==p.slug && x.tags.some((t)=>p.tags.includes(t)))
    .slice(0,3);

  const fallbackRelated=related.length>0
    ? related
    : getAllPosts().filter((x)=>x.slug!==p.slug && x.tags.some((t)=>p.tags.includes(t))).slice(0,3);

  return (
    <main>
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.04)] md:p-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-black uppercase tracking-[.16em] text-blue-600">
          {p.category} · {p.difficulty}
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-[-.055em] md:text-5xl">{p.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">{p.description}</p>
        <div className="mt-5 text-xs text-slate-400">
          {p.readingTime} · {p.publishedAt} · {p.tags.join(' · ')}
        </div>
        <div className="prose-design mt-10">{content}</div>
      </article>

      {fallbackRelated.length>0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Continue Learning</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {fallbackRelated.map((r)=>(
              <Link
                key={r.slug}
                href={allowed.has(r.category) ? `${basePath}/${r.slug}` : `/system-design/${r.slug}`}
                className="card p-5"
              >
                <div className="text-[10px] font-black uppercase text-blue-600">{r.category}</div>
                <div className="mt-2 font-bold">{r.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
