import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function PhotoCarousel({ slides = [], label, priority = false }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const touch = useRef(null);
  const photos = slides.filter(photo => photo.imageUrl && !failed[photo.imageUrl]);
  const active = photos.length ? index % photos.length : 0;
  const move = step => setIndex((active + step + photos.length) % photos.length);
  if (!photos.length) return null;
  const photo = photos[active];
  const controlClass = 'p-3 rounded-full bg-white text-[#031B44] border border-[#EAD7CF] hover:bg-[#F3E5D8] focus-visible:ring-2 focus-visible:ring-[#B30E1F]';
  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}
      className="w-full min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#B30E1F]"
      onKeyDown={event => {
        if (photos.length < 2) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-[#EAD7CF] bg-[#F0E6DA] shadow-sm"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={event => { const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={event => {
          const start = touch.current; touch.current = null;
          if (!start || photos.length < 2) return;
          const t = event.changedTouches[0]; const dx = t.clientX - start.x;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(t.clientY - start.y)) move(dx < 0 ? 1 : -1);
        }}>
        <img key={photo.imageUrl} src={photo.imageUrl} alt={photo.alt || 'Blood donation campaign'}
          className="absolute inset-0 w-full h-full object-contain" loading={priority ? 'eager' : 'lazy'}
          draggable={false}
          onError={() => setFailed(previous => ({ ...previous, [photo.imageUrl]: true }))} />
      </div>
      {photos.length > 1 && <div className="flex items-center justify-center gap-3 pt-3">
        <button type="button" aria-label={`Previous ${label} photo`} className={controlClass} onClick={() => move(-1)}><ArrowLeft size={18} /></button>
        <div className="flex flex-wrap justify-center gap-1">
          {photos.map((item, i) => <button type="button" key={item.id || `${item.imageUrl}-${i}`}
            aria-label={`Show ${label} photo ${i + 1}`} aria-current={i === active ? 'true' : undefined}
            className="p-3 rounded-full focus-visible:ring-2 focus-visible:ring-[#B30E1F]" onClick={() => setIndex(i)}>
            <span className={`block w-2 h-2 rounded-full ${i === active ? 'bg-[#B30E1F]' : 'bg-[#D2BCB0]'}`} />
          </button>)}
        </div>
        <button type="button" aria-label={`Next ${label} photo`} className={controlClass} onClick={() => move(1)}><ArrowRight size={18} /></button>
        <span className="sr-only" aria-live="polite">Photo {active + 1} of {photos.length}</span>
      </div>}
    </div>
  );
}
