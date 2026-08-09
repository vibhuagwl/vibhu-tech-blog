import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams(){
  return sectionStaticParams('distributed-systems');
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return sectionMetadata(slug,'/distributed-systems');
}

export default async function Article({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ArticleView slug={slug} section="distributed-systems" basePath="/distributed-systems"/>;
}
