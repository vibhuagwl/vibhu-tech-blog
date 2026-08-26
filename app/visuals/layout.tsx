import CatalogLayout from '@/components/catalog-layout';

export default function VisualsLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="visuals"
      config={{
        eyebrow:'Learn by image',
        title:'Visual Stories',
        description:'story diagrams first, short notes second',
        browseLabel:'Browse visual stories',
        filterPlaceholder:'Filter visuals…',
        basePath:'/visuals',
        groupOrder:['Visual Story'],
      }}
    >
      {children}
    </CatalogLayout>
  );
}
