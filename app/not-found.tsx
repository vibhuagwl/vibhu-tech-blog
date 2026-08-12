import Link from 'next/link';

export default function NotFound(){
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-center">
      <div className="text-sm font-semibold uppercase tracking-widest text-blue-700">404</div>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        This page does not exist.
      </h1>
      <p className="mt-4 text-slate-500">
        The article may have moved, or the URL may be incorrect.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
          Back to home
        </Link>
        <Link href="/search" className="inline-block rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
          Search topics
        </Link>
      </div>
    </main>
  );
}
