const basePath='/vibhu-tech-blog';

export default function Visual({
  src,
  alt,
  caption,
}:{
  src:string;
  alt:string;
  caption?:string;
}){
  const path=src.startsWith('/') ? src : `/${src}`;
  const url=path.startsWith(basePath) ? path : `${basePath}${path}`;

  return (
    <figure className="visual-story my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,.08)] dark:border-slate-800 dark:bg-slate-950">
      <div className="bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[.14em] text-blue-600 dark:bg-slate-900">
        Visual story · scroll sideways on mobile to read the full diagram
      </div>
      <div className="overflow-x-auto bg-white dark:bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="mx-auto block h-auto w-full object-contain"
          loading="eager"
        />
      </div>
      {caption && (
        <figcaption className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
