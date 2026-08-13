import type {FeatureStatus} from '@/lib/java-versions/types';

const STYLES: Record<FeatureStatus, string> = {
  LTS: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  'Feature Release': 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  FINAL: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  PREVIEW: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  INCUBATOR: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
  EXPERIMENTAL: 'bg-fuchsia-100 text-fuchsia-950 dark:bg-fuchsia-950 dark:text-fuchsia-100',
  DEPRECATED: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  REMOVED: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100',
};

export default function StatusBadge({status}:{status:FeatureStatus | string}){
  const cls=STYLES[status as FeatureStatus] ?? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.08em] ${cls}`}>
      {status}
    </span>
  );
}
