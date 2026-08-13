import {getAllPosts} from '@/lib/posts';
import {hrefForPost} from '@/lib/href';

export const dynamic='force-static';

export async function GET(){
  const base='https://vibhuagwl.github.io/vibhu-tech-blog';
  const items=getAllPosts().map((p)=>{
    const path=hrefForPost(p.category,p.slug);
    const link=`${base}${path}`;
    return `<item><title><![CDATA[${p.title}]]></title><link>${link}</link><guid>${link}</guid><description><![CDATA[${p.description}]]></description><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate></item>`;
  }).join('');
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Vibhu Tech Lab</title><link>${base}</link><description>System design, distributed systems, Kafka, Redis, and production engineering interview preparation.</description>${items}</channel></rss>`;
  return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
}
