import fs from 'node:fs';
import path from 'node:path';
import type {DemoSourceFile,DemoTreeNode} from '@/lib/oauth-demo-source';

export type {DemoSourceFile,DemoTreeNode};

const DEMO_ROOT=path.join(process.cwd(),'spring-authn-authz-demo');

const INCLUDE_EXT=new Set([
  '.java','.xml','.yml','.yaml','.sql','.md','.html','.sh','.json','.properties','.txt','.css',
]);

const SKIP_DIR=new Set(['target','.git','node_modules']);

function languageFor(filePath:string){
  const ext=path.extname(filePath).toLowerCase();
  switch(ext){
    case '.java': return 'java';
    case '.xml': return 'xml';
    case '.yml':
    case '.yaml': return 'yaml';
    case '.sql': return 'sql';
    case '.md': return 'markdown';
    case '.html': return 'html';
    case '.css': return 'text';
    case '.sh': return 'bash';
    case '.json': return 'json';
    case '.properties': return 'properties';
    default: return 'text';
  }
}

function walk(dir:string,base=DEMO_ROOT):string[]{
  if(!fs.existsSync(dir)) return [];
  const out:string[]=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP_DIR.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full,base));
    else if(INCLUDE_EXT.has(path.extname(entry.name).toLowerCase())){
      out.push(path.relative(base,full).split(path.sep).join('/'));
    }
  }
  return out;
}

export function listSpringAuthDemoFiles():DemoSourceFile[]{
  if(!fs.existsSync(DEMO_ROOT)) return [];
  return walk(DEMO_ROOT)
    .sort((a,b)=>a.localeCompare(b))
    .map((rel)=>{
      const abs=path.join(DEMO_ROOT,rel);
      const content=fs.readFileSync(abs,'utf8');
      return {
        path:rel,
        name:path.basename(rel),
        language:languageFor(rel),
        content,
        lines:content.length===0?0:content.split(/\r?\n/).length,
      };
    });
}

export function buildSpringAuthDemoTree(files:DemoSourceFile[]):DemoTreeNode[]{
  type Mutable={name:string;path?:string;children?:Map<string,Mutable>};
  const root=new Map<string,Mutable>();

  for(const file of files){
    const parts=file.path.split('/');
    let cursor=root;
    parts.forEach((part,idx)=>{
      const isLeaf=idx===parts.length-1;
      if(!cursor.has(part)){
        cursor.set(part,{name:part,children:isLeaf?undefined:new Map()});
      }
      const node=cursor.get(part)!;
      if(isLeaf){
        node.path=file.path;
      } else {
        if(!node.children) node.children=new Map();
        cursor=node.children;
      }
    });
  }

  function toArray(map:Map<string,Mutable>,prefix=''):DemoTreeNode[]{
    return [...map.values()]
      .sort((a,b)=>{
        const ad=a.children?0:1;
        const bd=b.children?0:1;
        if(ad!==bd) return ad-bd;
        return a.name.localeCompare(b.name);
      })
      .map((n)=>{
        const folderPath=prefix?`${prefix}/${n.name}`:n.name;
        return {
          name:n.name,
          path:n.path,
          folderPath:n.children?folderPath:undefined,
          children:n.children?toArray(n.children,folderPath):undefined,
        };
      });
  }

  return toArray(root);
}
