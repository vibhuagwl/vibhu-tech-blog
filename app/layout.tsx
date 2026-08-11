import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Linkedin, Github, Code2 } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'System Design Interview Hub | Vibhu Agarwal', template: '%s | Vibhu Agarwal' },
  description: 'Learn system design through real-world architecture, stories, diagrams, trade-offs and interview follow-ups.',
  metadataBase: new URL('https://vibhuagwl.github.io/vibhu-tech-blog'),
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:bg-slate-950/95">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5">
            <Link href="/" className="shrink-0 font-black tracking-tight text-lg">
              Vibhu<span className="text-blue-600">.</span>
            </Link>
            <nav className="hidden items-center gap-3 overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-300 md:flex lg:gap-4 lg:text-sm">
              <Link href="/learn">Learn</Link>
              <Link href="/system-design">System Design</Link>
              <Link href="/distributed-systems">Distributed Systems</Link>
              <Link href="/fintech">FinTech</Link>
              <Link href="/behavior">Behavior</Link>
              <Link href="/leadership-principles">Leadership Principles</Link>
              <Link href="/complexity">Complexity</Link>
              <Link href="/redis-interview">Redis Interview</Link>
              <Link href="/interview-questions">Interview Questions</Link>
              <Link href="/about">About</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/search" aria-label="Search" className="text-slate-600 hover:text-blue-600 dark:text-slate-300">
                <Search size={19}/>
              </Link>
              <ThemeToggle/>
            </div>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t bg-white dark:bg-slate-950">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-black dark:text-white">System Design Interview Hub</div>
              <div className="mt-1 text-sm text-slate-500">Learn · Design · Scale · Build</div>
            </div>
            <div className="flex gap-4 text-slate-500">
              <a href="https://www.linkedin.com/in/vibhuagwl/" aria-label="LinkedIn"><Linkedin size={18}/></a>
              <a href="https://github.com/vibhuagwl" aria-label="GitHub"><Github size={18}/></a>
              <a href="https://leetcode.com/u/vibhuagwl/" aria-label="LeetCode"><Code2 size={18}/></a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
