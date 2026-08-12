import CatalogLayout from '@/components/catalog-layout';
import {KAFKA_SIDEBAR_ORDER} from '@/lib/technology-hub';

export default function KafkaInterviewLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="kafka-interview"
      config={{
        eyebrow:'Kafka Tab',
        title:'Kafka',
        description:'Code · Optimization · Properties · Cheatsheet · Realtime',
        browseLabel:'Browse Kafka pages',
        filterPlaceholder:'Filter…',
        basePath:'/kafka-interview',
        groupOrder:['Kafka Interview'],
        slugOrder:KAFKA_SIDEBAR_ORDER,
        onlySlugOrder:true,
      }}
    >
      {children}
    </CatalogLayout>
  );
}
