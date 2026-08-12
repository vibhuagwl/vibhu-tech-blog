import CatalogLayout from '@/components/catalog-layout';
import {JPMC_SIDEBAR_ORDER} from '@/lib/jpmc-hub';

export default function JpmcExperienceLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="jpmc-experience"
      config={{
        eyebrow:'Experience hub',
        title:'JPMC Experience',
        description:'Hadron · Tax · RSU · Kafka · Platform — interview-ready production stories',
        browseLabel:'Browse JPMC experience topics',
        filterPlaceholder:'Filter JPMC topics…',
        basePath:'/jpmc-experience',
        groupOrder:['JPMC Experience'],
        slugOrder:JPMC_SIDEBAR_ORDER,
      }}
    >
      {children}
    </CatalogLayout>
  );
}
