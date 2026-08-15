'use client';

import {useState} from 'react';
import Mermaid from '@/components/mermaid';
import {MEMORY_STRIP, MSC_STORIES, WHITEBOARD_BEATS} from '@/lib/microservice-communication/stories';
import CodePanel from './code-panel';

export default function StoryWalkthrough() {
  const [tab, setTab] = useState<'stories' | 'whiteboard'>('stories');
  const [storyId, setStoryId] = useState(MSC_STORIES[0].id);
  const [beatId, setBeatId] = useState(WHITEBOARD_BEATS[0].id);
  const story = MSC_STORIES.find((s) => s.id === storyId) ?? MSC_STORIES[0];
  const beat = WHITEBOARD_BEATS.find((b) => b.id === beatId) ?? WHITEBOARD_BEATS[0];
  const storyIdx = MSC_STORIES.findIndex((s) => s.id === story.id);
  const beatIdx = WHITEBOARD_BEATS.findIndex((b) => b.id === beat.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['stories', 'Story theater'],
            ['whiteboard', 'A calls B whiteboard'],
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
        {MEMORY_STRIP.map((m) => (
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
            {MSC_STORIES.map((s) => (
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
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">{story.badge}</p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{story.title}</h3>
            <p className="mt-2 text-base font-medium text-slate-800 dark:text-slate-100">{story.hook}</p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={story.mermaid} />
            </div>
            <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-sm leading-7 text-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">Say this (60s)</p>
              <p className="mt-2">{story.say}</p>
            </div>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              Memory: {story.memory}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStoryId(MSC_STORIES[(storyIdx - 1 + MSC_STORIES.length) % MSC_STORIES.length].id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-900"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setStoryId(MSC_STORIES[(storyIdx + 1) % MSC_STORIES.length].id)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                Next
              </button>
              <span className="self-center text-xs text-slate-400">
                {storyIdx + 1}/{MSC_STORIES.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WHITEBOARD_BEATS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBeatId(b.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  b.id === beat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700'
                }`}
              >
                {b.title}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{beat.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{beat.hook}</p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid chart={beat.mermaid} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">{beat.say}</p>
            <CodePanel title="Memory" code={beat.memory} />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={beatIdx === 0}
                onClick={() => setBeatId(WHITEBOARD_BEATS[beatIdx - 1].id)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:bg-slate-900"
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
