import CatalogLayout from '@/components/catalog-layout';

export default function PerformanceLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="performance"
      config={{
        eyebrow:'Catalog',
        title:'Performance',
        description:'Java/Spring practical playbooks — latency, scale, cache, JVM, backpressure',
        browseLabel:'Browse performance topics',
        filterPlaceholder:'Filter performance topics…',
        basePath:'/performance',
        groupOrder:['Performance'],
        slugOrder:[
          'performance-master-index',
          'performance-latency-spike-investigation',
          'performance-scale-10k-to-1m',
          'performance-identify-bottlenecks',
          'performance-caching-spring-redis',
          'performance-jvm-high-throughput',
          'performance-backpressure-load-shedding',
        ],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
