'use client';

import {useEffect,useState} from 'react';
import {CHECKLIST} from '@/lib/java-versions/migration';

const STORAGE_KEY='java-versions-migration-checklist-v1';

export default function MigrationChecklist(){
  const [checked,setChecked]=useState<Record<string,boolean>>({});

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw) setChecked(JSON.parse(raw) as Record<string,boolean>);
    }catch{ /* ignore */ }
  },[]);

  useEffect(()=>{
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(checked));
    }catch{ /* ignore */ }
  },[checked]);

  const done=CHECKLIST.filter((c)=>checked[c]).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive checklist</h3>
          <p className="mt-1 text-sm text-slate-500">{done} / {CHECKLIST.length} complete (saved locally)</p>
        </div>
        <button
          type="button"
          onClick={()=>setChecked({})}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Reset
        </button>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className="h-full bg-slate-700 transition-all"
          style={{width:`${(done/CHECKLIST.length)*100}%`}}
        />
      </div>
      <ul className="mt-5 space-y-2">
        {CHECKLIST.map((item)=>(
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-900">
              <input
                type="checkbox"
                checked={!!checked[item]}
                onChange={()=>setChecked((s)=>({...s,[item]:!s[item]}))}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className={checked[item]?'text-slate-400 line-through':'text-slate-700 dark:text-slate-200'}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
