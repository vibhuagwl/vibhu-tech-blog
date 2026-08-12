/** Map article difficulty strings to a stable interview level. */
export function normalizeLevel(difficulty:string){
  const d=difficulty.toLowerCase();
  if(d.includes('principal') || d.includes('architect')) return 'Principal';
  if(d.includes('staff')) return 'Staff';
  if(d.includes('advanced') || d.includes('senior')) return 'Senior';
  if(d.includes('intermediate') || d.includes('medium')) return 'Intermediate';
  if(d.includes('beginner') || d.includes('foundation') || d.includes('easy')) return 'Foundation';
  return difficulty || 'Senior';
}

export function levelTone(level:string){
  const l=level.toLowerCase();
  if(l==='principal') return 'level-principal';
  if(l==='staff') return 'level-staff';
  if(l==='senior' || l==='advanced') return 'level-senior';
  if(l==='intermediate') return 'level-intermediate';
  return 'level-foundation';
}

/** Classify a heading for interview-oriented visual treatment. */
export function headingKind(text:string):'interview'|'takeaways'|'followup'|'story'|'question'|null{
  const t=text.toLowerCase();
  if(/\binterview answer\b|\bhow i would answer\b|\b30-second\b|\b2-minute\b|\b5-minute\b/.test(t)) return 'interview';
  if(/\bkey takeaway|\btakeaways\b|\bone-line\b|\bbest .*takeaway\b/.test(t)) return 'takeaways';
  if(/\bfollow[- ]?up|\binterviewer asks\b|\bhard follow/.test(t)) return 'followup';
  if(/\breal[- ]?world|\bproduction story|\bcase study\b|\bincident\b/.test(t)) return 'story';
  if(/\binterview question\b|\bthe real interview\b|\bthe question\b/.test(t)) return 'question';
  return null;
}

/** Prefer these heading labels for the article quick-nav strip. */
export function pickQuickNav(
  headings:{id:string;text:string;level:2|3}[],
  limit=6,
){
  const h2=headings.filter((h)=>h.level===2);
  if(h2.length<=limit) return h2;
  const priority=/(interview|answer|takeaway|follow|trade-?off|production|diagnos|approach|short answer|tldr|overview|question)/i;
  const preferred=h2.filter((h)=>priority.test(h.text));
  if(preferred.length>=3) return preferred.slice(0,limit);
  return h2.slice(0,limit);
}
