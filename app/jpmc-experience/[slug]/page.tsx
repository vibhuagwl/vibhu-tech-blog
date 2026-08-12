import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams(){
  return sectionStaticParams('jpmc-experience');
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return sectionMetadata(slug,'/jpmc-experience');
}

export default async function Article({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ArticleView slug={slug} section="jpmc-experience" basePath="/jpmc-experience"/>;
}
