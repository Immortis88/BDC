import React, { useEffect, useState } from 'react';

export default function HeroPhotoCarousel({ slides = [], label = 'Campaign photos', priority = false, aspectClass = 'aspect-[4/3] sm:aspect-[3/2]' }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const photos = slides.filter(photo => photo.imageUrl && !failed[photo.imageUrl]);
  const active = photos.length ? index % photos.length : 0;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (photos.length < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(previous => (previous + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [photos.length, paused, reducedMotion]);

  if (!photos.length) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${label}. Focus or hover to pause. Use arrow keys to browse.`}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={event => {
        if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        setIndex((active + (event.key === 'ArrowLeft' ? -1 : 1) + photos.length) % photos.length);
      }}
      className={`relative isolate w-full min-w-0 ${aspectClass} overflow-hidden rounded-[24px] border border-[#EAD7CF] bg-[#EDE2D6] shadow-[0_12px_36px_-18px_rgba(49,30,18,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-4`}
    >
      {photos.map((photo, position) => (
        <div
          key={photo.id || `${photo.imageUrl}-${position}`}
          aria-hidden={position !== active}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out motion-reduce:transition-none ${position === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img src={photo.imageUrl} alt={photo.alt || 'Blood donation campaign'}
            draggable={false} decoding="async" loading="eager" fetchPriority={priority && position === 0 ? 'high' : 'auto'}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: photo.focalPosition || 'center' }}
            onError={() => setFailed(previous => ({ ...previous, [photo.imageUrl]: true }))} />
        </div>
      ))}
    </div>
  );
}
