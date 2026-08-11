import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams(){
  return sectionStaticParams('kafka-interview');
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return sectionMetadata(slug,'/kafka-interview');
}

export default async function Article({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ArticleView slug={slug} section="kafka-interview" basePath="/kafka-interview"/>;
}
