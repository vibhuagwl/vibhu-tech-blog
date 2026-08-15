import CatalogLayout from '@/components/catalog-layout';

/** Sidebar: curricula only — locking chapters live under the master index. */
const CURRICULUM_SLUGS = [
  'distributed-locking-master-index',
  '2pl-3pl-money-transfer-interview',
  'consistent-hashing',
  'gateway-live-interview-lab',
  'cdc-and-outbox',
  'oauth2-jwt-spring-boot-demo',
  'spring-security-authn-authz-demo',
];

export default function DistributedLayout({children}: {children: React.ReactNode}) {
  return (
    <CatalogLayout
      section="distributed-systems"
      config={{
        eyebrow: 'Curricula',
        title: 'Distributed Systems',
        description: 'One entry per curriculum — deep chapters under each index',
        browseLabel: 'Browse curricula',
        filterPlaceholder: 'Filter curricula…',
        basePath: '/distributed-systems',
        groupOrder: ['Distributed Systems', 'Caching', 'Messaging', 'Infrastructure', 'Reliability'],
        slugOrder: CURRICULUM_SLUGS,
        onlySlugOrder: true,
      }}
    >
      {children}
    </CatalogLayout>
  );
}
