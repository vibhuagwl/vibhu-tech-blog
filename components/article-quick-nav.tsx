import type {Heading} from '@/lib/headings';

export default function ArticleQuickNav({items}:{items:Heading[]}){
  if(items.length<2) return null;

  return (
    <nav aria-label="Article sections" className="article-quick-nav">
      <div className="article-quick-nav__label">Jump to</div>
      <ul className="article-quick-nav__list">
        {items.map((h)=>(
          <li key={h.id}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
