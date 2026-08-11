import {MetadataRoute} from 'next';
import {getAllPosts,getPostsByCategories,SECTION_CATEGORIES} from '@/lib/posts';

export const dynamic='force-static';

export default function sitemap():MetadataRoute.Sitemap{
  const base='https://vibhuagwl.github.io/vibhu-tech-blog';
  const sections=[
    {path:'/system-design', key:'system-design' as const},
    {path:'/distributed-systems', key:'distributed-systems' as const},
    {path:'/fintech', key:'fintech' as const},
    {path:'/behavior', key:'behavior' as const},
    {path:'/behavioral-interview', key:'behavioral-interview' as const},
    {path:'/leadership-principles', key:'leadership-principles' as const},
    {path:'/complexity', key:'complexity' as const},
    {path:'/kafka-interview', key:'kafka-interview' as const},
    {path:'/redis-interview', key:'redis-interview' as const},
  ];

  return [
    {url:base, lastModified:new Date()},
    {url:`${base}/learn`, lastModified:new Date()},
    {url:`${base}/interview-questions`, lastModified:new Date()},
    {url:`${base}/about`, lastModified:new Date()},
    ...sections.flatMap(({path,key})=>[
      {url:`${base}${path}`, lastModified:new Date()},
      ...getPostsByCategories([...SECTION_CATEGORIES[key]]).map((p)=>({
        url:`${base}${path}/${p.slug}`,
        lastModified:new Date(p.publishedAt),
      })),
    ]),
    // Keep canonical system-design URLs for all posts that remain in that catalog
    ...getPostsByCategories([...SECTION_CATEGORIES['system-design']]).map((p)=>({
      url:`${base}/system-design/${p.slug}`,
      lastModified:new Date(p.publishedAt),
    })),
  ];
}
