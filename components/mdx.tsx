import {ReactNode} from 'react';
export const mdxComponents={h2:(p:any)=><h2 {...p}/>,h3:(p:any)=><h3 {...p}/>,p:(p:any)=><p {...p}/>,ul:(p:any)=><ul {...p}/>,ol:(p:any)=><ol {...p}/>,pre:(p:any)=><pre {...p}/>,blockquote:(p:any)=><blockquote {...p}/>,code:(p:any)=><code {...p}/>};
export function Mermaid({children}:{children:ReactNode}){return <pre className="not-prose"><code>{children}</code></pre>}
