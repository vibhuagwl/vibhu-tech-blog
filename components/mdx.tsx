import Link from 'next/link';
import Mermaid from './mermaid';
import CodeBlock from './code-block';
import ZoomableImage from './zoomable-image';
import {slugify,textFromChildren} from '@/lib/slugify';
import {headingKind} from '@/lib/article-meta';

function isInternalHref(href:unknown){
  return typeof href==='string' && href.startsWith('/') && !href.startsWith('//');
}

function Heading({
  as:Tag,
  children,
  ...rest
}:{
  as:'h2'|'h3'|'h4';
  children?:React.ReactNode;
} & React.HTMLAttributes<HTMLHeadingElement>){
  const text=textFromChildren(children);
  const id=rest.id || slugify(text) || undefined;
  const kind=headingKind(text);
  return (
    <Tag
      id={id}
      {...rest}
      {...(kind?{'data-kind':kind,className:[rest.className,`heading-kind-${kind}`].filter(Boolean).join(' ')}:{})}
    >
      {children}
    </Tag>
  );
}

function Pre(props:any){
  const child=Array.isArray(props.children)?props.children[0]:props.children;
  const className=child?.props?.className as string|undefined;
  const codeChildren=child?.props?.children;

  // Fenced blocks arrive as <pre><code className="language-...">
  if(child?.type==='code' || child?.props?.className || typeof codeChildren==='string'){
    return (
      <CodeBlock className={className}>
        {codeChildren ?? props.children}
      </CodeBlock>
    );
  }

  return <pre {...props}/>;
}

export const mdxComponents={
  h2:(p:any)=><Heading as="h2" {...p}/>,
  h3:(p:any)=><Heading as="h3" {...p}/>,
  h4:(p:any)=><Heading as="h4" {...p}/>,
  p:(p:any)=><p {...p}/>,
  ul:(p:any)=><ul {...p}/>,
  ol:(p:any)=><ol {...p}/>,
  pre:Pre,
  blockquote:(p:any)=><blockquote {...p}/>,
  code:(p:any)=><code {...p}/>,
  a:(p:any)=>{
    const {href,children,...rest}=p;

    if(isInternalHref(href)){
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }

    const external=typeof href==='string' && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...rest}
        {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}
      >
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
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
  img:(p:any)=><ZoomableImage {...p}/>,
  Mermaid,
};
