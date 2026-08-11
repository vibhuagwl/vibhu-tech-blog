import CatalogLayout from '@/components/catalog-layout';

export default function RedisInterviewLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="redis-interview"
      config={{
        eyebrow:'Catalog',
        title:'Redis Interview',
        description:'Staff+ / Principal / Architect — 165+ production questions',
        browseLabel:'Browse Redis interview topics',
        filterPlaceholder:'Filter Redis topics…',
        basePath:'/redis-interview',
        groupOrder:['Redis Interview'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
