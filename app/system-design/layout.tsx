import CatalogLayout from '@/components/catalog-layout';

export default function SystemDesignLayout({children}:{children:React.ReactNode}){
  return (
    <CatalogLayout
      section="system-design"
      config={{
        eyebrow:'Catalog',
        title:'System Design',
        description:'click any problem to open it',
        browseLabel:'Browse all problems',
        filterPlaceholder:'Filter problems…',
        basePath:'/system-design',
      }}
    >
      {children}
    </CatalogLayout>
  );
}
