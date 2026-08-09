import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams(){
  return sectionStaticParams('fintech');
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return sectionMetadata(slug,'/fintech');
}

export default async function Article({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ArticleView slug={slug} section="fintech" basePath="/fintech"/>;
}
