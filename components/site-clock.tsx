'use client';

import {useEffect, useState} from 'react';

function formatNow(d: Date) {
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
  return {date, time};
}

/** Live local date/time for site chrome — presentation only. */
export default function SiteClock({className = ''}: {className?: string}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return (
      <time className={`site-clock ${className}`.trim()} aria-hidden="true">
        <span className="site-clock__date">—</span>
        <span className="site-clock__time">—:—:—</span>
      </time>
    );
  }

  const {date, time} = formatNow(now);

  return (
    <time
      className={`site-clock ${className}`.trim()}
      dateTime={now.toISOString()}
      title={`Local time · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
    >
      <span className="site-clock__date">{date}</span>
      <span className="site-clock__sep" aria-hidden="true">
        ·
      </span>
      <span className="site-clock__time">{time}</span>
    </time>
  );
}
