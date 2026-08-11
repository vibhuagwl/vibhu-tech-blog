import Mermaid from './mermaid';

export const mdxComponents={
  h2:(p:any)=><h2 {...p}/>,
  h3:(p:any)=><h3 {...p}/>,
  p:(p:any)=><p {...p}/>,
  ul:(p:any)=><ul {...p}/>,
  ol:(p:any)=><ol {...p}/>,
  pre:(p:any)=><pre {...p}/>,
  blockquote:(p:any)=><blockquote {...p}/>,
  code:(p:any)=><code {...p}/>,
  a:(p:any)=><a {...p}/>,
  table:(p:any)=>(
    <div className="table-wrap">
      <table {...p}/>
    </div>
  ),
  thead:(p:any)=><thead {...p}/>,
  tbody:(p:any)=><tbody {...p}/>,
  tr:(p:any)=><tr {...p}/>,
  th:(p:any)=><th {...p}/>,
  td:(p:any)=><td {...p}/>,
  Mermaid,
};
