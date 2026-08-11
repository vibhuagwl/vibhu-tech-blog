import CatalogLayout from '@/components/catalog-layout';

export default function ComplexityLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="complexity"
      config={{
        eyebrow:'Catalog',
        title:'Complexity',
        description:'Big-O, data structures, sorting — best to worst',
        browseLabel:'Browse complexity topics',
        filterPlaceholder:'Filter complexity topics…',
        basePath:'/complexity',
        groupOrder:['Complexity'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
