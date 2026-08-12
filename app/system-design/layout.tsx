import CatalogLayout from '@/components/catalog-layout';

const SYSTEM_DESIGN_SLUG_ORDER=[
  'system-design-master-index',
  'design-whatsapp',
  'design-evoting',
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
