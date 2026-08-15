'use client';

import {useEffect, useState} from 'react';

/** Thin reading progress — presentation only; does not alter article content. */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.querySelector('.reading-article .article-body');
      if (!el) {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const height = el.scrollHeight;
      const view = window.innerHeight;
      const max = Math.max(1, height - view);
      const current = window.scrollY - top + view * 0.15;
      setProgress(Math.min(100, Math.max(0, (current / max) * 100)));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="reading-progress__bar" style={{width: `${progress}%`}} />
    </div>
  );
}
