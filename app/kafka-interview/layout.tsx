import CatalogLayout from '@/components/catalog-layout';
import {KAFKA_SIDEBAR_ORDER} from '@/lib/technology-hub';

export default function KafkaInterviewLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="kafka-interview"
      config={{
        eyebrow:'Knowledge system',
        title:'Kafka',
        description:'Learn · Experience · Optimize · Configure · Troubleshoot · Upgrade · Interview · Recall',
        browseLabel:'Browse Kafka learning map',
        filterPlaceholder:'Filter Kafka topics…',
        basePath:'/kafka-interview',
        groupOrder:['Kafka Interview'],
        slugOrder:KAFKA_SIDEBAR_ORDER,
      }}
    >
      {children}
    </CatalogLayout>
  );
}
