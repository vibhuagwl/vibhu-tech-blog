import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Post={
  slug:string;
  title:string;
  description:string;
  category:string;
  difficulty:string;
  tags:string[];
  readingTime:string;
  publishedAt:string;
  content:string;
};

export type NavPost={
  slug:string;
  title:string;
  category:string;
  difficulty:string;
  readingTime:string;
};

const root=path.join(process.cwd(),'content');

function asDateString(value:unknown){
  if(value instanceof Date) return value.toISOString().slice(0,10);
  return String(value ?? '');
}

export function getAllPosts():Post[]{
  const files:string[]=[];
  function walk(d:string){
    for(const e of fs.readdirSync(d,{withFileTypes:true})){
      const p=path.join(d,e.name);
      if(e.isDirectory()) walk(p);
      else if(e.name.endsWith('.mdx')) files.push(p);
    }
  }
  if(fs.existsSync(root)) walk(root);
  return files.map(file=>{
    const raw=fs.readFileSync(file,'utf8');
    const {data,content}=matter(raw);
    return {
      ...data,
      slug: data.slug ?? path.basename(file,'.mdx'),
      publishedAt: asDateString(data.publishedAt),
      content,
    } as Post;
  }).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug:string){return getAllPosts().find(p=>p.slug===slug)}
export function getCategories(){return [...new Set(getAllPosts().map(p=>p.category))]}

export function getPostsByCategories(categories:string[]){
  const set=new Set(categories);
  return getAllPosts().filter((p)=>set.has(p.category));
}

export function toNavPosts(posts:Post[]):NavPost[]{
  return posts.map((p)=>({
    slug:p.slug,
    title:p.title,
    category:p.category,
    difficulty:p.difficulty,
    readingTime:p.readingTime,
  }));
}

export const SECTION_CATEGORIES={
  'system-design':[
    'Fundamentals',
    'System Design',
    'Infrastructure',
    'Caching',
    'Messaging',
    'Distributed Systems',
    'FinTech',
    'Reliability',
    'Cheat Sheet',
  ],
  'distributed-systems':['Distributed Systems','Caching','Messaging','Infrastructure','Reliability'],
  fintech:['FinTech'],
  behavior:['Behavior'],
  'leadership-principles':['Leadership Principles'],
  complexity:['Complexity'],
  'behavioral-interview':['Behavioral Interview'],
  'kafka-interview':['Kafka Interview'],
  'redis-interview':['Redis Interview'],
  'realtime-issues':['Real-Time Issues'],
  'jpmc-experience':['JPMC Experience'],
  performance:['Performance'],
} as const;

