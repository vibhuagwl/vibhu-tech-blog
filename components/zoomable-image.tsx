'use client';

import {useCallback,useEffect,useId,useState} from 'react';
import {X,ZoomIn} from 'lucide-react';

type ZoomableImageProps={
  src?:string;
  alt?:string;
  title?:string;
  className?:string;
  width?:string|number;
  height?:string|number;
};

export default function ZoomableImage({
  src,
  alt='',
  title,
  className,
  width,
  height,
}:ZoomableImageProps){
  const [open,setOpen]=useState(false);
  const titleId=useId();

  const close=useCallback(()=>setOpen(false),[]);

  useEffect(()=>{
    if(!open) return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape') close();
    };
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    window.addEventListener('keydown',onKey);
    return ()=>{
      document.body.style.overflow=prev;
      window.removeEventListener('keydown',onKey);
    };
  },[open,close]);

  if(!src) return null;

  return (
    <>
      <figure className="zoomable-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          title={title}
          className={className}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
        <button
          type="button"
          className="zoomable-image__btn"
          aria-label={alt?`Zoom image: ${alt}`:'Zoom image'}
          onClick={()=>setOpen(true)}
        >
          <ZoomIn size={18} aria-hidden="true"/>
        </button>
      </figure>

      {open && (
        <div
          className="zoomable-image__lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div className="zoomable-image__lightbox-bar">
            <span id={titleId} className="zoomable-image__lightbox-title">
              {alt || 'Image preview'}
            </span>
            <button
              type="button"
              className="zoomable-image__lightbox-close"
              aria-label="Close zoomed image"
              onClick={close}
            >
              <X size={20} aria-hidden="true"/>
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="zoomable-image__lightbox-img"
            onClick={(e)=>e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
