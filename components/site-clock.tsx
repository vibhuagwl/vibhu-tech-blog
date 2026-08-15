'use client';

import {useEffect, useState} from 'react';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatNow(d: Date) {
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);

  // Always show seconds (locale hour cycle + explicit :SS).
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const hour = get('hour') || pad2(d.getHours());
  const minute = get('minute') || pad2(d.getMinutes());
  const second = get('second') || pad2(d.getSeconds());
  const dayPeriod = get('dayPeriod');
  const time = dayPeriod
    ? `${hour}:${minute}:${second} ${dayPeriod}`
    : `${hour}:${minute}:${second}`;

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
