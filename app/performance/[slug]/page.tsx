import CatalogLayout from '@/components/catalog-layout';
import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

export function generateStaticParams() {
  return sectionStaticParams('performance');
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  return sectionMetadata(slug, '/performance');
}

export default async function Article({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  return (
    <CatalogLayout
      section="performance"
      config={{
        eyebrow: 'Playbooks',
        title: 'Performance',
        description: 'Deep incident playbooks — after the /performance handbook',
        browseLabel: 'Browse playbooks',
        filterPlaceholder: 'Filter playbooks…',
        basePath: '/performance',
        groupOrder: ['Performance'],
        slugOrder: [
          'performance-master-index',
          'performance-latency-spike-investigation',
          'performance-scale-10k-to-1m',
          'performance-identify-bottlenecks',
          'performance-caching-spring-redis',
          'performance-jvm-high-throughput',
          'performance-backpressure-load-shedding',
        ],
      }}
    >
      <ArticleView slug={slug} section="performance" basePath="/performance" />
    </CatalogLayout>
  );
}
