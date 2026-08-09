import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams(){
  return sectionStaticParams('behavior');
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return sectionMetadata(slug,'/behavior');
}

export default async function Article({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ArticleView slug={slug} section="behavior" basePath="/behavior"/>;
}
