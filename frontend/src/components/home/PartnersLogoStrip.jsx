import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pause, Play } from 'lucide-react';



/**
 * Responsive explicit spacing classes between partner logos.
 * Using matching gap and padding-right guarantees the loop boundary gap
 * matches the exact same separation between items within the set.
 */
const MARQUEE_SPACING_CLASSES =
  'gap-16 sm:gap-20 lg:gap-28 xl:gap-32 pr-16 sm:pr-20 lg:pr-28 xl:pr-32';

/**
 * Standalone Logo Item:
 * - Natural width based on aspect ratio
 * - Bounded responsive height and maximum width
 * - Vertically centered, object-fit: contain (no cropping, stretching, boxes, or borders)
 * - Accounts for internal asset whitespace
 */
function PartnerLogoItem({ partner, isDuplicate = false, onImageLoad }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="shrink-0 flex items-center justify-center select-none"
      role={isDuplicate ? 'presentation' : 'group'}
      aria-hidden={isDuplicate ? 'true' : undefined}
      aria-label={isDuplicate ? undefined : partner.name}
    >
      {!hasError && partner.logo ? (
        <img
          src={partner.logo}
          alt={isDuplicate ? '' : partner.name}
          title={partner.name}
          className="h-16 sm:h-20 md:h-24 lg:h-28 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] w-auto object-contain pointer-events-none select-none transition-transform duration-300 hover:scale-105"
          loading="lazy"
          draggable={false}
          onLoad={onImageLoad}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-base sm:text-lg md:text-xl font-bold text-[#031B44] text-center leading-snug tracking-tight px-4 py-2">
          {partner.name}
        </span>
      )}
    </div>
  );
}

/**
 * Horizontally scrolling partner logo marquee:
 * - One horizontal, non-wrapping row of vertically centered logos
 * - Natural width per aspect ratio with bounded height/max-width
 * - Generous explicit gap between items matching the reference
 * - Loop boundary gap matched identically to intra-set gaps
 * - Dynamic track measurement via ResizeObserver and image load events (no hardcoded widths)
 * - No visible boxes, borders, shadows, or side fades
 * - Clips only at the outer marquee viewport with natural partial entrance/exit visibility
 * - Pauses on hover and keyboard focus
 * - Full pointer dragging / touch swipe support
 * - Centered pause/play toggle button; revealed on keyboard focus on desktop
 * - Respects prefers-reduced-motion
 */
export default function PartnersLogoStrip({ partners = [] }) {
  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const set1Ref = useRef(null);

  const setWidthRef = useRef(0);
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

  // When partners count is too small, render static row
  const isScrollable = partners && partners.length > 3;

  // Measure the exact rendered width of Set 1 (including its trailing gap)
  const updateTrackMeasurements = useCallback(() => {
    if (set1Ref.current) {
      const rect = set1Ref.current.getBoundingClientRect();
      if (rect.width > 0) {
        setWidthRef.current = rect.width;
      }
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    updateTrackMeasurements();
  }, [updateTrackMeasurements]);

  // Recalculate track measurements when images load, DOM resizes, or viewport changes
  useEffect(() => {
    updateTrackMeasurements();

    if (typeof ResizeObserver !== 'undefined' && set1Ref.current) {
      const ro = new ResizeObserver(() => {
        updateTrackMeasurements();
      });
      ro.observe(set1Ref.current);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateTrackMeasurements);
    return () => window.removeEventListener('resize', updateTrackMeasurements);
  }, [updateTrackMeasurements]);

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

  // Continuous smooth loop via requestAnimationFrame (moving right to left)
  useEffect(() => {
    if (!isScrollable) return;
    const track = trackRef.current;
    if (!track) return;

    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;

      const setWidth = setWidthRef.current;

      const shouldAnimate =
        setWidth > 0 &&
        !isExplicitlyPaused &&
        !isHovered &&
        !isFocused &&
        !isDraggingRef.current &&
        !prefersReducedMotion;

      if (shouldAnimate) {
        // Speed: ~35px per second for smooth, unhurried brand display
        const step = 0.035 * Math.min(deltaMs, 34);
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
  }, [isScrollable, isExplicitlyPaused, isHovered, isFocused, prefersReducedMotion]);

  // Pointer hover on desktop: pause while pointer is over logo strip, resume on leave
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
    if (isUsingKeyboardRef.current || e.target.closest?.('.partners-pause-btn-wrap')) {
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
    if (!isScrollable) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isScrollable]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const setWidth = setWidthRef.current;
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
    if (!trackRef.current || !isScrollable) return;
    const setWidth = setWidthRef.current;
    if (setWidth <= 0) return;
    const step = 200; // Step increment

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
  }, [isScrollable]);

  // Static row fallback if too few logos to scroll
  if (!isScrollable) {
    return (
      <div className="w-full flex items-center justify-center flex-wrap gap-12 sm:gap-16 lg:gap-24 py-6 sm:py-8">
        {partners.map((partner) => (
          <PartnerLogoItem key={partner.id} partner={partner} isDuplicate={false} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full partners-strip-root"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Outer Marquee Viewport: clips only at the outer boundary with natural partial entry/exit */}
      <div className="relative w-full overflow-hidden">
        {/* Draggable Logo Track */}
        <div
          ref={containerRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none py-2.5 sm:py-3.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B30E1F]/50 rounded-2xl"
          style={{ touchAction: 'pan-y' }}
          tabIndex={0}
          role="region"
          aria-label="Our Valued Partners logo marquee. Use arrow keys to browse."
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={trackRef}
            className="flex items-center will-change-transform w-max py-2 sm:py-3"
          >
            {/* Set 1: Primary set (accessible for screen readers) */}
            <div
              ref={set1Ref}
              className={`flex items-center flex-nowrap ${MARQUEE_SPACING_CLASSES}`}
            >
              {partners.map((partner) => (
                <PartnerLogoItem
                  key={partner.id}
                  partner={partner}
                  isDuplicate={false}
                  onImageLoad={handleImageLoad}
                />
              ))}
            </div>

            {/* Set 2: Duplicate for seamless loop */}
            <div
              className={`flex items-center flex-nowrap ${MARQUEE_SPACING_CLASSES}`}
              aria-hidden="true"
            >
              {partners.map((partner) => (
                <PartnerLogoItem
                  key={`${partner.id}-dup1`}
                  partner={partner}
                  isDuplicate={true}
                  onImageLoad={handleImageLoad}
                />
              ))}
            </div>

            {/* Set 3: Triplicate to guarantee ultra-wide viewports (>2560px) never experience blank gaps */}
            <div
              className={`flex items-center flex-nowrap ${MARQUEE_SPACING_CLASSES}`}
              aria-hidden="true"
            >
              {partners.map((partner) => (
                <PartnerLogoItem
                  key={`${partner.id}-dup2`}
                  partner={partner}
                  isDuplicate={true}
                  onImageLoad={handleImageLoad}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Accessible Pause/Play Button between logo strip and "View all partners" */}
      <div
        className={`partners-pause-btn-wrap mt-3 sm:mt-4 ${
          isKeyboardRevealed ? 'is-keyboard-revealed' : ''
        }`}
      >
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#031B44] border border-[#EAD7CF] shadow-xs hover:shadow transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
          aria-label={isExplicitlyPaused ? 'Play partners scroll' : 'Pause partners scroll'}
          title={isExplicitlyPaused ? 'Play partners scroll' : 'Pause partners scroll'}
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
