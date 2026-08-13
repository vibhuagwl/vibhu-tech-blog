import Link from 'next/link';
import {Code2,Github,Linkedin} from 'lucide-react';
import {TOPIC_GROUPS} from '@/lib/site-nav';

const START_LINKS = [
  {href: '/learn', label: 'Learning paths'},
  {href: '/interview-questions', label: 'Interview practice'},
  {href: '/search', label: 'Search topics'},
  {href: '/java-compiler', label: 'Java Compiler IDE'},
  {href: '/about', label: 'About'},
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_2.45fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="site-brand__mark" aria-hidden="true">
                VA
              </span>
              <div>
                <div className="text-lg font-bold tracking-[-.03em] text-[var(--ink)]">Vibhu Tech Lab</div>
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
                  Senior Interview Hub
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--muted)]">
              Professional preparation for senior Java and distributed-systems interviews — architecture,
              production ops, data platforms, and leadership communication.
            </p>
            <div className="mt-6 flex gap-1 text-[var(--muted)]">
              <a
                href="https://www.linkedin.com/in/vibhuagwl/"
                aria-label="LinkedIn"
                className="rounded-lg p-2.5 transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://github.com/vibhuagwl"
                aria-label="GitHub"
                className="rounded-lg p-2.5 transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <Github size={18} />
              </a>
              <a
                href="https://leetcode.com/u/vibhuagwl/"
                aria-label="LeetCode"
                className="rounded-lg p-2.5 transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                <Code2 size={18} />
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">Start</div>
              <ul className="mt-3 space-y-2.5">
                {START_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm font-semibold text-[var(--ink)]/80 transition hover:text-[var(--accent)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {TOPIC_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
                  {group.title}
                </div>
                <ul className="mt-3 space-y-2.5">
                  {group.topics.map((t) => (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        className="text-sm font-semibold text-[var(--ink)]/80 transition hover:text-[var(--accent)]"
                      >
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Vibhu Agarwal · Engineering interview knowledge</span>
          <span className="font-mono text-[11px] tracking-wide">Java · Spring · AWS · Distributed Systems</span>
        </div>
      </div>
    </footer>
  );
}
