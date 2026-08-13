import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-[-.04em] text-[var(--ink)]">
        This page does not exist.
      </h1>
      <p className="mt-4 text-[var(--muted)]">The article may have moved, or the URL may be incorrect.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/search" className="btn-secondary">
          Search topics
        </Link>
      </div>
    </main>
  );
}
