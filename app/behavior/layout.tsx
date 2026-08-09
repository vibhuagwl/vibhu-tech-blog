import CatalogLayout from '@/components/catalog-layout';

export default function BehaviorLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="behavior"
      config={{
        eyebrow:'Catalog',
        title:'Behavioral',
        description:'stories, leadership, ownership, communication',
        browseLabel:'Browse behavioral topics',
        filterPlaceholder:'Filter behavioral topics…',
        basePath:'/behavior',
        groupOrder:['Behavior'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
