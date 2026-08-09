import {getPostsByCategories,toNavPosts,SECTION_CATEGORIES} from '@/lib/posts';
import ProblemNav, {type ProblemNavConfig} from '@/components/problem-nav';

export default function CatalogLayout({
  section,
  config,
  children,
}:{
  section:keyof typeof SECTION_CATEGORIES;
  config:ProblemNavConfig;
  children:React.ReactNode;
}){
  const posts=toNavPosts(getPostsByCategories([...SECTION_CATEGORIES[section]]));

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <ProblemNav posts={posts} config={config}/>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
