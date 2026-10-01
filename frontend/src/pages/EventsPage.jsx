import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { api } from '../services/api.js';

function PosterLightbox({ posters, activeIndex, onChange, onClose }) {
  const closeButton = useRef(null);
  const touchStartX = useRef(null);
  const count = posters.length;

  const step = useCallback((direction) => {
    if (count < 2) return;
    onChange((activeIndex + direction + count) % count);
  }, [activeIndex, count, onChange]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') step(-1);
      else if (event.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, step]);

  const poster = posters[activeIndex];
  if (!poster) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Event poster viewer"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 px-3 py-4"
      onClick={onClose}
      onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
      onTouchEnd={event => {
        if (touchStartX.current == null) return;
        const delta = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
      }}>
      <button ref={closeButton} type="button" aria-label="Close poster viewer" onClick={onClose}
        className="absolute right-3 top-3 sm:right-5 sm:top-5 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <X className="h-6 w-6" />
      </button>
      {count > 1 && <>
        <button type="button" aria-label="Previous poster" onClick={event => { event.stopPropagation(); step(-1); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" aria-label="Next poster" onClick={event => { event.stopPropagation(); step(1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5">
          <ChevronRight className="h-6 w-6" />
        </button>
      </>}
      <img key={poster.id || poster.url} src={poster.url} alt={poster.alt || `Awareness campaign event poster ${activeIndex + 1}`}
        onClick={event => event.stopPropagation()} draggable={false}
        className="max-h-[84vh] max-w-[94vw] select-none rounded-lg object-contain shadow-2xl" />
      {count > 1 && <p className="mt-3 text-xs text-white/70">{activeIndex + 1} / {count}</p>}
    </div>, document.body
  );
}

export default function EventsPage() {
  const [posters, setPosters] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    let mounted = true;
    api.content.getPages()
      .then(result => {
        if (!mounted || !result?.success) return;
        const publishedPosters = result.data?.events?.posters;
        setPosters(Array.isArray(publishedPosters) ? publishedPosters.filter(poster => poster?.url) : []);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#FFFDF9] px-4 py-8 sm:px-6 sm:py-12" aria-label="Events">
      <h1 className="sr-only">Events</h1>
      <section aria-label="Awareness campaign event posters" className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
        {posters.map((poster, index) => (
          <figure key={poster.id || poster.asset_id || poster.url || index} className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-3">
            <button type="button" onClick={() => setActiveIndex(index)}
              aria-label={`Open ${poster.alt || `event poster ${index + 1}`} in full-screen viewer`}
              className="group relative block aspect-[2/3] w-full cursor-zoom-in overflow-hidden rounded-xl bg-[#FAF4EB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#981B24] focus-visible:ring-offset-2">
            <img
              src={poster.url}
              alt={poster.alt || `Awareness campaign event poster ${index + 1}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-0 block h-full w-full object-cover"
            />
              <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-full bg-slate-950/65 p-2 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Maximize2 className="h-4 w-4" /></span>
            </button>
          </figure>
        ))}
      </section>
      {activeIndex !== null && <PosterLightbox posters={posters} activeIndex={activeIndex} onChange={setActiveIndex} onClose={closeLightbox} />}
    </main>
  );
}
