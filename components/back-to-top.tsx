'use client';

import {useEffect,useState} from 'react';
import {ArrowUp} from 'lucide-react';

export default function BackToTop(){
  const [show,setShow]=useState(false);

  useEffect(()=>{
    const onScroll=()=>setShow(window.scrollY>640);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);

  if(!show) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
      className="fixed bottom-6 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      <ArrowUp size={18}/>
    </button>
  );
}
