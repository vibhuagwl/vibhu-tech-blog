import CatalogLayout from '@/components/catalog-layout';

export default function RealtimeIssuesLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="realtime-issues"
      config={{
        eyebrow:'Catalog',
        title:'Real-Time Issues',
        description:'Staff+ / Principal production incident playbooks — stuck threads, pools, DB locks, Kafka, GC',
        browseLabel:'Browse real-time issue topics',
        filterPlaceholder:'Filter incident topics…',
        basePath:'/realtime-issues',
        groupOrder:['Real-Time Issues'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
