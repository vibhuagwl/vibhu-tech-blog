import {getAllPosts} from '@/lib/posts';
import ProblemNav from '@/components/problem-nav';

export default function SystemDesignLayout({children}:{children:React.ReactNode}){
  const posts=getAllPosts().map((p)=>({
    slug:p.slug,
    title:p.title,
    category:p.category,
    difficulty:p.difficulty,
    readingTime:p.readingTime,
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <ProblemNav posts={posts}/>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
