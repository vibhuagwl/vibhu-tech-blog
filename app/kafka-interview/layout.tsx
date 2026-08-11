import CatalogLayout from '@/components/catalog-layout';

export default function KafkaInterviewLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="kafka-interview"
      config={{
        eyebrow:'Catalog',
        title:'Kafka Interview',
        description:'Staff+ / Principal / Architect — 130+ production questions',
        browseLabel:'Browse Kafka interview topics',
        filterPlaceholder:'Filter Kafka topics…',
        basePath:'/kafka-interview',
        groupOrder:['Kafka Interview'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
