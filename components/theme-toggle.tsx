'use client';

import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';

export default function ThemeToggle(){
  const [dark,setDark]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem('theme');
    const value=saved==='dark';
    setDark(value);
    document.documentElement.classList.toggle('dark',value);
  },[]);

  function toggle(){
    const next=!dark;
    setDark(next);
    localStorage.setItem('theme',next?'dark':'light');
    document.documentElement.classList.toggle('dark',next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
    >
      {dark?<Sun size={17}/>:<Moon size={17}/>}
    </button>
  );
}
