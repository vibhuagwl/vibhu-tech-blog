import {slugify} from '@/lib/slugify';

export type Heading={
  level:2|3;
  text:string;
  id:string;
};

/** Extract ## / ### headings from MDX source for TOC (skips fenced code). */
export function extractHeadings(source:string):Heading[]{
  const lines=source.split(/\r?\n/);
  const out:Heading[]=[];
  const used=new Map<string,number>();
  let inFence=false;

  for(const line of lines){
    if(/^```/.test(line)){
      inFence=!inFence;
      continue;
    }
    if(inFence) continue;

    const m=/^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if(!m) continue;

    const level=(m[1].length===2?2:3) as 2|3;
    const text=m[2].replace(/[*_`]/g,'').trim();
    if(!text) continue;

    let id=slugify(text) || 'section';
    const n=used.get(id) ?? 0;
    used.set(id,n+1);
    if(n>0) id=`${id}-${n+1}`;

    out.push({level,text,id});
  }

  return out;
}
