import CatalogLayout from '@/components/catalog-layout';
import ArticleView, {sectionMetadata, sectionStaticParams} from '@/components/article-view';

/** Sidebar / browse: curricula only — chapter deep-links live inside each master index. */
const CURRICULUM_SLUGS = [
  'realtime-issues-master-index',
  'stuck-thread-incident-response',
  'stuck-thread-cheat-sheet',
  'process-10gb-file-master-index',
  'java-30yoe-interview-master-index',
  'api-integration-frameworks-master-index',
  'aurora-postgresql-master-index',
  'oracle-database-realtime-troubleshooting',
  'oracle-database-incident-case-study',
  'java-migration-master-index',
  'lead-experience-master-index',
  'query-used-to-be-fast-now-timeouts',
  'production-database-change-risk-checklist',
  'spring-secrets-pii-handling',
];

export function generateStaticParams() {
  return sectionStaticParams('realtime-issues');
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  return sectionMetadata(slug, '/realtime-issues');
}

export default async function Article({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  return (
    <CatalogLayout
      section="realtime-issues"
      config={{
        eyebrow: 'Curricula',
        title: 'Real-Time Issues',
        description: 'On-call curricula — open a master index, then deep chapters',
        browseLabel: 'Browse curricula',
        filterPlaceholder: 'Filter curricula…',
        basePath: '/realtime-issues',
        groupOrder: ['Real-Time Issues'],
        slugOrder: CURRICULUM_SLUGS,
        onlySlugOrder: true,
      }}
    >
      <ArticleView slug={slug} section="realtime-issues" basePath="/realtime-issues" />
    </CatalogLayout>
  );
}
