'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {
  CAP_STORIES,
  STORY_MEMORY_STRIP,
  WHITEBOARD_BEATS,
  type CapStory,
} from '@/lib/cap-theorem/stories';
import CodePanel from './code-panel';

const CHOOSE_STYLE: Record<CapStory['choose'], string> = {
  CP: 'bg-slate-900 text-white',
  AP: 'bg-emerald-800 text-white',
  Hybrid: 'bg-amber-800 text-white',
  PACELC: 'bg-sky-900 text-white',
  Myth: 'bg-rose-900 text-white',
};

export default function StoryWalkthrough() {
  const [storyId, setStoryId] = useState(CAP_STORIES[0].id);
  const [beatId, setBeatId] = useState(WHITEBOARD_BEATS[0].id);
  const [tab, setTab] = useState<'stories' | 'whiteboard'>('stories');
  const story = CAP_STORIES.find((s) => s.id === storyId) ?? CAP_STORIES[0];
  const beat = WHITEBOARD_BEATS.find((b) => b.id === beatId) ?? WHITEBOARD_BEATS[0];
  const storyIdx = CAP_STORIES.findIndex((s) => s.id === story.id);
  const beatIdx = WHITEBOARD_BEATS.findIndex((b) => b.id === beat.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['stories', 'Story theater'],
            ['whiteboard', '90s whiteboard'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
              tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STORY_MEMORY_STRIP.map((m) => (
          <div
            key={m.title}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">{m.title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{m.line}</p>
          </div>
        ))}
      </div>

      {tab === 'stories' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CAP_STORIES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStoryId(s.id)}
                className={`rounded-lg px-3 py-1.5 text-left text-xs font-semibold ${
                  s.id === story.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${CHOOSE_STYLE[story.choose]}`}>
                {story.choose}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{story.badge}</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{story.title}</h3>
            <p className="mt-2 text-base font-medium text-slate-800 dark:text-slate-100">{story.hook}</p>
            <p className="mt-2 text-sm text-slate-500">
              <strong>Cast:</strong> {story.cast}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{story.plot}</p>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={story.mermaid} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-4 text-sm leading-7 text-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">Say this (60s)</p>
                <p className="mt-2">{story.spoken60s}</p>
              </div>
              <div>
                <CodePanel title="Whiteboard steps" code={story.whiteboard} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <p className="rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                Memory: {story.memory}
              </p>
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-rose-900 dark:bg-rose-950 dark:text-rose-100">
                Trap: {story.trap}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStoryId(CAP_STORIES[(storyIdx - 1 + CAP_STORIES.length) % CAP_STORIES.length].id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                Prev story
              </button>
              <button
                type="button"
                onClick={() => setStoryId(CAP_STORIES[(storyIdx + 1) % CAP_STORIES.length].id)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                Next story
              </button>
              <span className="self-center text-xs text-slate-400">
                {storyIdx + 1} / {CAP_STORIES.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Click each beat in order — this is the drawable path for &quot;Explain CAP&quot; in system design.
          </p>
          <div className="flex flex-wrap gap-2">
            {WHITEBOARD_BEATS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBeatId(b.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  b.id === beat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{beat.label}</p>
            <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{beat.say}</p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={beat.mermaid} />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={beatIdx === 0}
                onClick={() => setBeatId(WHITEBOARD_BEATS[beatIdx - 1].id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-100"
              >
                Prev beat
              </button>
              <button
                type="button"
                disabled={beatIdx === WHITEBOARD_BEATS.length - 1}
                onClick={() => setBeatId(WHITEBOARD_BEATS[beatIdx + 1].id)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next beat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
