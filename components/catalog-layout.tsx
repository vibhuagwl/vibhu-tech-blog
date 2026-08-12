import {getPostsByCategories,toNavPosts,SECTION_CATEGORIES} from '@/lib/posts';
import CatalogLayoutShell from '@/components/catalog-layout-shell';
import type {ProblemNavConfig} from '@/components/problem-nav';

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
    <CatalogLayoutShell posts={posts} config={config}>
      {children}
    </CatalogLayoutShell>
  );
}
