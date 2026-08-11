export function hrefForPost(category:string, slug:string){
  if(category==='Leadership Principles') return `/leadership-principles/${slug}`;
  if(category==='Kafka Interview') return `/kafka-interview/${slug}`;
  if(category==='Complexity') return `/complexity/${slug}`;
  if(category==='Behavior') return `/behavior/${slug}`;
  if(category==='FinTech') return `/fintech/${slug}`;
  if(['Distributed Systems','Caching','Messaging','Infrastructure','Reliability'].includes(category)){
    return `/distributed-systems/${slug}`;
  }
  return `/system-design/${slug}`;
}
