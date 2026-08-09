import CatalogLayout from '@/components/catalog-layout';

export default function DistributedLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="distributed-systems"
      config={{
        eyebrow:'Catalog',
        title:'Distributed Systems',
        description:'caching, messaging, partitioning, resilience',
        browseLabel:'Browse distributed topics',
        filterPlaceholder:'Filter topics…',
        basePath:'/distributed-systems',
        groupOrder:['Distributed Systems','Caching','Messaging','Infrastructure'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
