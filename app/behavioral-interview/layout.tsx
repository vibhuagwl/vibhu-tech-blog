import CatalogLayout from '@/components/catalog-layout';

export default function BehavioralInterviewLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="behavioral-interview"
      config={{
        eyebrow:'Catalog',
        title:'Behavioral Interview',
        description:'Staff+ / Principal STAR answers — leadership & impact',
        browseLabel:'Browse behavioral interview topics',
        filterPlaceholder:'Filter behavioral topics…',
        basePath:'/behavioral-interview',
        groupOrder:['Behavioral Interview'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
