export type JavaIdeFile={
  path:string;
  content:string;
};

export const DEFAULT_MAIN_PATH='com/example/demo/Main.java';

export const DEFAULT_MAIN_SOURCE=`package com.example.demo;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Compiler IDE!");
        System.out.println(Greeter.greet("Cursor"));
    }
}
`;

export const DEFAULT_HELPER_PATH='com/example/demo/Greeter.java';

export const DEFAULT_HELPER_SOURCE=`package com.example.demo;

public class Greeter {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
`;

export function createDefaultProject():JavaIdeFile[]{
  return [
    {path:DEFAULT_MAIN_PATH,content:DEFAULT_MAIN_SOURCE},
    {path:DEFAULT_HELPER_PATH,content:DEFAULT_HELPER_SOURCE},
  ];
}

export function detectMainClasses(files:JavaIdeFile[]):string[]{
  const found:string[]=[];
  for(const file of files){
    if(!/public\s+static\s+void\s+main\s*\(/.test(file.content)) continue;
    const pkg=file.content.match(/^\s*package\s+([\w.]+)\s*;/m);
    const cls=file.content.match(/public\s+class\s+(\w+)/);
    if(!cls) continue;
    found.push(pkg?`${pkg[1]}.${cls[1]}`:cls[1]);
  }
  return found;
}

export function pathToPackageHint(filePath:string){
  const noExt=filePath.replace(/\.java$/,'');
  const parts=noExt.split('/');
  if(parts.length<=1) return '(default package)';
  return parts.slice(0,-1).join('.');
}

export function fileNameFromPath(filePath:string){
  return filePath.split('/').pop() || filePath;
}

export function buildTree(paths:string[]){
  type Node={name:string;path?:string;children?:Node[]};
  const root:Node[]=[];

  function ensure(list:Node[],name:string,isFile:boolean,full?:string){
    let node=list.find((n)=>n.name===name);
    if(!node){
      node=isFile?{name,path:full}:{name,children:[]};
      list.push(node);
    }
    return node;
  }

  for(const p of paths.slice().sort()){
    const parts=p.split('/');
    let cursor=root;
    parts.forEach((part,idx)=>{
      const isFile=idx===parts.length-1;
      const node=ensure(cursor,part,isFile,isFile?p:undefined);
      if(!isFile){
        if(!node.children) node.children=[];
        cursor=node.children;
      }
    });
  }
  return root;
}
