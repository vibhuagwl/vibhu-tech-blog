/** Stable heading ids shared by MDX headings and the article TOC. */
export function slugify(input:string){
  return input
    .toLowerCase()
    .trim()
    .replace(/[`*_~\[\]]/g,'')
    .replace(/<[^>]+>/g,'')
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
}

export function textFromChildren(children:unknown):string{
  if(children==null || typeof children==='boolean') return '';
  if(typeof children==='string' || typeof children==='number') return String(children);
  if(Array.isArray(children)) return children.map(textFromChildren).join('');
  if(typeof children==='object' && children!==null && 'props' in children){
    return textFromChildren((children as {props?:{children?:unknown}}).props?.children);
  }
  return '';
}
