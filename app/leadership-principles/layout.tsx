import CatalogLayout from '@/components/catalog-layout';

export default function LeadershipPrinciplesLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="leadership-principles"
      config={{
        eyebrow:'Catalog',
        title:'Leadership Principles',
        description:'all 16 Amazon LPs with STAR answers & Kafka follow-ups',
        browseLabel:'Browse leadership principles',
        filterPlaceholder:'Filter principles…',
        basePath:'/leadership-principles',
        groupOrder:['Leadership Principles'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
