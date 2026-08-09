import fs from 'node:fs'; import path from 'node:path'; import matter from 'gray-matter';
export type Post={slug:string;title:string;description:string;category:string;difficulty:string;tags:string[];readingTime:string;publishedAt:string;content:string};
const root=path.join(process.cwd(),'content');
export function getAllPosts():Post[]{const files:string[]=[];function walk(d:string){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.mdx'))files.push(p)}} if(fs.existsSync(root))walk(root);return files.map(file=>{const raw=fs.readFileSync(file,'utf8');const {data,content}=matter(raw);return {...data,slug: data.slug ?? path.basename(file,'.mdx'),content} as Post}).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));}
export function getPost(slug:string){return getAllPosts().find(p=>p.slug===slug)}
export function getCategories(){return [...new Set(getAllPosts().map(p=>p.category))]}
