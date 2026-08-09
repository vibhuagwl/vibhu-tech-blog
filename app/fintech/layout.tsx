import CatalogLayout from '@/components/catalog-layout';

export default function FintechLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="fintech"
      config={{
        eyebrow:'Catalog',
        title:'FinTech',
        description:'payments, ledgers, correctness under uncertainty',
        browseLabel:'Browse FinTech topics',
        filterPlaceholder:'Filter FinTech topics…',
        basePath:'/fintech',
        groupOrder:['FinTech'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
