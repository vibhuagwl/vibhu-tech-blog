import Link from 'next/link';
import Mermaid from './mermaid';

function isInternalHref(href:unknown) {
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');
}

export const mdxComponents = {
  h2: (p: any) => <h2 {...p} />,
  h3: (p: any) => <h3 {...p} />,
  p: (p: any) => <p {...p} />,
  ul: (p: any) => <ul {...p} />,
  ol: (p: any) => <ol {...p} />,
  pre: (p: any) => <pre {...p} />,
  blockquote: (p: any) => <blockquote {...p} />,
  code: (p: any) => <code {...p} />,
  a: (p: any) => {
    const {href, children, ...rest} = p;

    // Internal links must use Next <Link> so basePath (/vibhu-tech-blog) is applied.
    if (isInternalHref(href)) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  table: (p: any) => (
    <div className="table-wrap">
      <table {...p} />
    </div>
  ),
  thead: (p: any) => <thead {...p} />,
  tbody: (p: any) => <tbody {...p} />,
  tr: (p: any) => <tr {...p} />,
  th: (p: any) => <th {...p} />,
  td: (p: any) => <td {...p} />,
  Mermaid,
};
