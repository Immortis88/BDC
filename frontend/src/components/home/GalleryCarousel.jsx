import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pause, Play } from 'lucide-react';
import ImagePlaceholder from '../common/ImagePlaceholder.jsx';



/**
 * Individual Gallery Card: Simple rounded photo card with subtle shadow
 * and a gentle 3-4px hover lift with smooth transition.
 */
function GalleryCard({ photo, isDuplicate = false }) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="select-none shrink-0 py-2 group"
      role={isDuplicate ? 'presentation' : 'group'}
      aria-hidden={isDuplicate ? 'true' : undefined}
      aria-label={isDuplicate ? undefined : photo.alt}
    >
      <div className="relative w-fit min-w-[180px] sm:min-w-[220px] lg:min-w-[260px] rounded-2xl overflow-hidden bg-[#FAF4EB] shadow-sm border border-[#EAD7CF]/70 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-md">
        {!hasError ? (
          <img
            src={photo.src}
            alt={isDuplicate ? '' : photo.alt}
            className={`block h-[180px] sm:h-[220px] lg:h-[260px] w-auto max-w-[80vw] object-contain pointer-events-none select-none transition-opacity duration-500 ease-out ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
          />
        ) : (
          <ImagePlaceholder
            className="w-[260px] h-[180px] sm:w-[320px] sm:h-[220px] lg:w-[360px] lg:h-[260px] rounded-2xl"
            iconClassName="w-8 h-8"
            label="BDC camp moment"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Horizontally moving image carousel:
 * - Simple rounded photo cards with subtle shadow and 3-4px hover lift
 * - Continuous smooth 60fps horizontal loop via requestAnimationFrame
 * - Centered pause/play button between image row and "View full gallery"
 * - Always visible on mobile and touch devices (including tablets)
 * - Visually hidden during normal viewing on desktop with mouse; pauses on hover and resumes on leave
 * - Pauses on keyboard focus and reveals the pause/play control for keyboard users
 * - On mobile/touch, tapping pause keeps playback paused until user taps play
 * - Preserves reduced-motion preferences by disabling automatic scrolling
 */
export default function GalleryCarousel({ photos = [] }) {
  if (!photos || photos.length === 0) return null;
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const isUsingKeyboardRef = useRef(false);

  const [isExplicitlyPaused, setIsExplicitlyPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardRevealed, setIsKeyboardRevealed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsExplicitlyPaused(true);
    }

    const handler = (e) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setIsExplicitlyPaused(true);
    };

    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  // Track keyboard navigation vs pointer interaction
  useEffect(() => {
    const handleKeyDownWindow = (e) => {
      if (e.key === 'Tab' || e.key.startsWith('Arrow')) {
        isUsingKeyboardRef.current = true;
      }
    };
    const handlePointerDownWindow = () => {
      isUsingKeyboardRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDownWindow, true);
    window.addEventListener('pointerdown', handlePointerDownWindow, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDownWindow, true);
      window.removeEventListener('pointerdown', handlePointerDownWindow, true);
    };
  }, []);

  // Continuous smooth loop via requestAnimationFrame
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;

      // Track width of one full set of items (half of total scrollWidth)
      const setWidth = track.scrollWidth / 2;

      const shouldAnimate =
        setWidth > 0 &&
        !isExplicitlyPaused &&
        !isHovered &&
        !isFocused &&
        !isDraggingRef.current &&
        !prefersReducedMotion;

      if (shouldAnimate) {
        // Speed: 0.045 px/ms (~45px per second at 60fps)
        const step = 0.045 * Math.min(deltaMs, 34);
        offsetRef.current = (offsetRef.current + step) % setWidth;
        track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isExplicitlyPaused, isHovered, isFocused, prefersReducedMotion]);

  // Pointer hover on desktop: pause while pointer is over image row, resume on leave
  const handleMouseEnter = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!isFinePointer) return;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Keyboard focus handlers: pause scrolling and reveal pause/play control
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (isUsingKeyboardRef.current || e.target.closest?.('.gallery-pause-btn-wrap')) {
      setIsKeyboardRevealed(true);
    }
  }, []);

  const handleBlur = useCallback((e) => {
    if (rootRef.current && e.relatedTarget && rootRef.current.contains(e.relatedTarget)) {
      return;
    }
    setIsFocused(false);
    setIsKeyboardRevealed(false);
  }, []);

  // Toggle explicit pause/play
  const handleTogglePlay = useCallback(() => {
    setIsExplicitlyPaused((prev) => !prev);
  }, []);

  // Pointer dragging / touch swiping handlers
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const setWidth = trackRef.current.scrollWidth / 2;
    if (setWidth <= 0) return;

    const deltaX = startXRef.current - e.clientX;
    let nextOffset = (startOffsetRef.current + deltaX) % setWidth;
    if (nextOffset < 0) nextOffset += setWidth;
    offsetRef.current = nextOffset;
    trackRef.current.style.transform = `translate3d(-${nextOffset}px, 0, 0)`;
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }, []);

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  const handleKeyDown = useCallback((e) => {
    if (!trackRef.current) return;
    const setWidth = trackRef.current.scrollWidth / 2;
    if (setWidth <= 0) return;
    const step = 340; // Approx card width + gap

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      offsetRef.current = (offsetRef.current + step) % setWidth;
      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      let prev = (offsetRef.current - step) % setWidth;
      if (prev < 0) prev += setWidth;
      offsetRef.current = prev;
      trackRef.current.style.transform = `translate3d(-${prev}px, 0, 0)`;
    }
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative w-full gallery-carousel-root"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Draggable Carousel Viewport with headroom for hover lift and shadows */}
      <div
        ref={containerRef}
        className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none py-3 sm:py-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B30E1F]/50 rounded-2xl"
        style={{ touchAction: 'pan-y' }}
        tabIndex={0}
        role="region"
        aria-label="Moments That Matter gallery carousel. Use left and right arrow keys to navigate."
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {/* Continuous Transform Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-6 sm:gap-8 lg:gap-9 will-change-transform w-max px-4 sm:px-6 lg:px-8 py-1"
        >
          {/* Set 1: Primary items exposed to screen readers */}
          {photos.map((photo) => (
            <GalleryCard key={photo.id} photo={photo} isDuplicate={false} />
          ))}

          {/* Set 2: Duplicate items for seamless continuous loop, hidden from screen readers */}
          {photos.map((photo) => (
            <GalleryCard key={`${photo.id}-duplicate`} photo={photo} isDuplicate={true} />
          ))}
        </div>
      </div>

      {/* Centered Pause/Play Button between image row and "View full gallery" */}
      <div
        className={`gallery-pause-btn-wrap mt-3 sm:mt-4 ${
          isKeyboardRevealed ? 'is-keyboard-revealed' : ''
        }`}
      >
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#031B44] border border-[#EAD7CF] shadow-xs hover:shadow transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
          aria-label={isExplicitlyPaused ? 'Play gallery carousel' : 'Pause gallery carousel'}
          title={isExplicitlyPaused ? 'Play gallery carousel' : 'Pause gallery carousel'}
        >
          {isExplicitlyPaused ? (
            <Play className="w-4 h-4 text-[#031B44] ml-0.5" aria-hidden="true" />
          ) : (
            <Pause className="w-4 h-4 text-[#031B44]" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
