import CatalogLayout from '@/components/catalog-layout';

const SYSTEM_DESIGN_SLUG_ORDER=[
  'system-design-master-index',
  'whatsapp-system-design-master-index',
  'whatsapp-diagrams-memory-map',
  'design-whatsapp',
  'whatsapp-requirements-architecture',
  'whatsapp-message-flow',
  'whatsapp-user-contact-group',
  'whatsapp-one-to-one-messaging',
  'whatsapp-group-messaging',
  'whatsapp-ordering-idempotency',
  'whatsapp-offline-presence-websocket',
  'whatsapp-redis-distributed-lock',
  'whatsapp-kafka',
  'whatsapp-media-realtime',
  'whatsapp-calls',
  'whatsapp-status-broadcast-search-devices',
  'whatsapp-polls-events-payments',
  'whatsapp-database-sharding',
  'whatsapp-scale-security-observability',
  'whatsapp-interview-failures-cheatsheet',
  'design-url-shortener',
  'design-rate-limiter',
  'design-key-value-store',
  'design-instagram',
  'design-uber',
  'design-notification-system',
  'design-payment-system',
];

export default function SystemDesignLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="system-design"
      config={{
        eyebrow:'Catalog',
        title:'System Design',
        description:'click any problem to open it',
        browseLabel:'Browse all problems',
        filterPlaceholder:'Filter problems…',
        basePath:'/system-design',
        slugOrder:SYSTEM_DESIGN_SLUG_ORDER,
      }}
    >
      {children}
    </CatalogLayout>
  );
}
