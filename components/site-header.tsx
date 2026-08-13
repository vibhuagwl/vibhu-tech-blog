'use client';

import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {ChevronDown,Menu,Search,X} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import {
  PRIMARY_LINKS,
  TOPIC_GROUPS,
  findActiveTopicGroup,
  isNavActive,
  type NavGroup,
} from '@/lib/site-nav';

function TopicMegaMenu({
  query,
  onQuery,
  onNavigate,
  activeGroupId,
}:{
  query:string;
  onQuery:(v:string)=>void;
  onNavigate:()=>void;
  activeGroupId:string|null;
}){
  const q=query.trim().toLowerCase();
  const groups=useMemo(()=>{
    if(!q) return TOPIC_GROUPS;
    return TOPIC_GROUPS
      .map((g)=>({
        ...g,
        topics:g.topics.filter((t)=>
          t.label.toLowerCase().includes(q)
          || t.blurb.toLowerCase().includes(q)
          || g.title.toLowerCase().includes(q)
        ),
      }))
      .filter((g)=>g.topics.length>0);
  },[q]);

  return (
    <div className="site-mega" role="menu" aria-label="Topics directory">
      <div className="site-mega__toolbar">
        <label className="site-mega__search">
          <Search size={15} aria-hidden="true"/>
          <input
            value={query}
            onChange={(e)=>onQuery(e.target.value)}
            placeholder="Filter topics…"
            aria-label="Filter topics"
            autoFocus
          />
        </label>
        <Link href="/learn" className="site-mega__all" onClick={onNavigate}>
          Full curriculum →
        </Link>
      </div>

      {groups.length===0?(
        <div className="site-mega__empty">No topics match “{query}”.</div>
      ):(
        <div className="site-mega__grid">
          {groups.map((group)=>(
            <section key={group.id} className="site-mega__col">
              <div className={`site-mega__col-title ${activeGroupId===group.id?'is-active':''}`}>
                {group.title}
              </div>
              <p className="site-mega__col-desc">{group.description}</p>
              <ul className="site-mega__list">
                {group.topics.map((t)=>(
                  <li key={t.href}>
                    <Link href={t.href} className="site-mega__link" onClick={onNavigate}>
                      <span className="site-mega__link-label">{t.label}</span>
                      <span className="site-mega__link-blurb">{t.blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileGroup({
  group,
  open,
  onToggle,
  pathname,
}:{
  group:NavGroup;
  open:boolean;
  onToggle:()=>void;
  pathname:string|null;
}){
  return (
    <div className="site-mobile__group">
      <button
        type="button"
        className="site-mobile__group-btn"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>
          <span className="site-mobile__group-title">{group.title}</span>
          <span className="site-mobile__group-desc">{group.description}</span>
        </span>
        <ChevronDown size={16} className={`transition ${open?'rotate-180':''}`}/>
      </button>
      {open && (
        <ul className="site-mobile__topics">
          {group.topics.map((t)=>(
            <li key={t.href}>
              <Link
                href={t.href}
                className={`site-mobile__topic ${isNavActive(pathname,t.href)?'is-active':''}`}
              >
                <span className="font-semibold">{t.label}</span>
                <span className="text-xs text-slate-500">{t.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SiteHeader(){
  const pathname=usePathname();
  const [mobileOpen,setMobileOpen]=useState(false);
  const [topicsOpen,setTopicsOpen]=useState(false);
  const [topicQuery,setTopicQuery]=useState('');
  const [mobileGroups,setMobileGroups]=useState<Record<string,boolean>>({});
  const megaRef=useRef<HTMLDivElement>(null);
  const topicsBtnRef=useRef<HTMLButtonElement>(null);
  const activeGroup=findActiveTopicGroup(pathname);

  useEffect(()=>{
    setMobileOpen(false);
    setTopicsOpen(false);
    setTopicQuery('');
  },[pathname]);

  useEffect(()=>{
    document.body.style.overflow=mobileOpen?'hidden':'';
    return ()=>{document.body.style.overflow='';};
  },[mobileOpen]);

  useEffect(()=>{
    if(!topicsOpen) return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape') setTopicsOpen(false);
    };
    const onClick=(e:MouseEvent)=>{
      const target=e.target as Node;
      if(megaRef.current?.contains(target)) return;
      if(topicsBtnRef.current?.contains(target)) return;
      setTopicsOpen(false);
    };
    window.addEventListener('keydown',onKey);
    window.addEventListener('mousedown',onClick);
    return ()=>{
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('mousedown',onClick);
    };
  },[topicsOpen]);

  useEffect(()=>{
    if(!activeGroup) return;
    setMobileGroups((prev)=>({...prev,[activeGroup.id]:true}));
  },[activeGroup]);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <div className="site-header__left">
          <button
            type="button"
            className="site-header__icon-btn md:hidden"
            aria-label={mobileOpen?'Close navigation':'Open navigation'}
            aria-expanded={mobileOpen}
            onClick={()=>setMobileOpen((v)=>!v)}
          >
            {mobileOpen?<X size={18}/>:<Menu size={18}/>}
          </button>
          <Link href="/" className="site-brand">
            <span className="site-brand__mark">VA</span>
            <span className="site-brand__text">
              <span className="site-brand__name">Vibhu Tech Lab</span>
              <span className="site-brand__tag">Interview Hub</span>
            </span>
          </Link>
        </div>

        <nav className="site-header__nav" aria-label="Primary">
          {PRIMARY_LINKS.map((link)=>(
            <Link
              key={link.href}
              href={link.href}
              className={`site-header__link ${isNavActive(pathname,link.href)?'is-active':''}`}
            >
              {link.label}
            </Link>
          ))}

          <button
            ref={topicsBtnRef}
            type="button"
            className={`site-header__link site-header__topics-btn ${topicsOpen || activeGroup?'is-active':''}`}
            aria-expanded={topicsOpen}
            aria-haspopup="true"
            onClick={()=>setTopicsOpen((v)=>!v)}
          >
            Topics
            <ChevronDown size={14} className={`transition ${topicsOpen?'rotate-180':''}`}/>
          </button>
        </nav>

        <div className="site-header__right">
          <Link href="/search" aria-label="Search" className="site-header__icon-btn">
            <Search size={18}/>
          </Link>
          <ThemeToggle/>
        </div>
      </div>

      {topicsOpen && (
        <div className="site-mega-wrap" ref={megaRef}>
          <div className="site-mega-inner">
            <TopicMegaMenu
              query={topicQuery}
              onQuery={setTopicQuery}
              onNavigate={()=>setTopicsOpen(false)}
              activeGroupId={activeGroup?.id ?? null}
            />
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="site-mobile">
          <nav className="site-mobile__nav" aria-label="Mobile">
            <div className="site-mobile__primary">
              {PRIMARY_LINKS.map((link)=>(
                <Link key={link.href} href={link.href} className="site-mobile__primary-link">
                  {link.label}
                </Link>
              ))}
              <Link href="/search" className="site-mobile__primary-link">Search</Link>
            </div>

            <div className="site-mobile__section-label">Browse by category</div>
            {TOPIC_GROUPS.map((group)=>(
              <MobileGroup
                key={group.id}
                group={group}
                pathname={pathname}
                open={!!mobileGroups[group.id]}
                onToggle={()=>setMobileGroups((prev)=>({
                  ...prev,
                  [group.id]:!prev[group.id],
                }))}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
