export function hrefForPost(category:string, slug:string){
  if(category==='Leadership Principles') return `/leadership-principles/${slug}`;
  if(category==='Behavioral Interview') return `/behavioral-interview/${slug}`;
  if(category==='Kafka Interview') return `/kafka-interview/${slug}`;
  if(category==='Redis Interview') return `/redis-interview/${slug}`;
  if(category==='Real-Time Issues') return `/realtime-issues/${slug}`;
  if(category==='Performance') return `/performance/${slug}`;
  if(category==='JPMC Experience') return `/jpmc-experience/${slug}`;
  if(category==='Complexity') return `/complexity/${slug}`;
  if(category==='Behavior') return `/behavior/${slug}`;
  if(category==='FinTech') return `/fintech/${slug}`;
  if(['Distributed Systems','Caching','Messaging','Infrastructure','Reliability'].includes(category)){
    return `/distributed-systems/${slug}`;
  }
  return `/system-design/${slug}`;
}
