import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Image as ImageIcon, Tag, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ImagePlaceholder from '../components/common/ImagePlaceholder.jsx';
import HeroWave from '../components/common/HeroWave.jsx';
import { formatCampDate } from '../utils/dateUtils.js';
import { api } from '../services/api.js';

/* ─── Category filter pill ───────────────────────────────────────────── */

function CategoryPill({ label, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
        active
          ? 'bg-[#981B24] text-white border-[#981B24] shadow-xs'
          : 'bg-white text-[#374151] border-[#F3DEDA] hover:border-[#981B24]/40 hover:bg-[#FFFDF9]'
      }`}
    >
      {label}
      {count != null && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Single photo card ──────────────────────────────────────────────── */

function PhotoCard({ photo, onOpen}) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = photo.photoUrl || photo.image_url || photo.photo_url;

  return (
        <div
      className={`relative rounded-2xl overflow-hidden bg-[#FAF4EB] border border-[#F3DEDA] shadow-2xs group break-inside-avoid mb-4 sm:mb-5 ${
        !hasError && src ? 'cursor-zoom-in' : ''
      }`}
      {...(!hasError && src
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': `View photo: ${photo.caption || photo.alt_text || 'BDC Camp Moment'}`,
            onClick: onOpen,
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
              }
            },
          }
        : {})}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={photo.alt_text || photo.caption || 'BDC Camp Moment'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`block w-full h-auto object-contain transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <ImagePlaceholder
          className="w-full min-h-[180px]"
          iconClassName="w-6 h-6"
          label={photo.caption || photo.alt_text || 'BDC Moment'}
        />
      )}

      {(photo.caption || photo.category) && (
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end">
          {photo.category && (
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">
              {photo.category}
            </span>
          )}
          {photo.caption && (
            <p className="text-xs text-white font-medium line-clamp-2 leading-snug">
              {photo.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Lightbox ───────────────────────────────────────────────────────── */

function getPhotoSrc(p) {
  return p.photoUrl || p.image_url || p.photo_url;
}

function GalleryLightbox({ photos, activeId, onChange, onClose }) {
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const n = photos.length;
  const index = photos.findIndex((p) => p.id === activeId);

  const step = useCallback(
    (dir) => {
      if (n < 2) return;
      const i = photos.findIndex((p) => p.id === activeId);
      onChange(photos[(i + dir + n) % n].id);
    },
    [photos, activeId, n, onChange]
  );

  // Lock page scroll, focus the close button, restore focus on close
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  // Keyboard: Esc, left / right arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  if (index === -1) return null;
  const photo = photos[index];
  const src = getPhotoSrc(photo);

  return createPortal(
    <div
      className="lb-backdrop fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 px-3"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close photo viewer"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="w-6 h-6" />
      </button>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next photo"
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <img
        key={src}
        src={src}
        alt={photo.alt_text || photo.caption || 'BDC Camp Moment'}
        onClick={(e) => e.stopPropagation()}
        className="lb-image max-w-[94vw] max-h-[78vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
        draggable={false}
      />

      <div className="mt-3 max-w-[90vw] text-center" onClick={(e) => e.stopPropagation()}>
        {photo.caption && <p className="text-sm text-white/90 leading-snug">{photo.caption}</p>}
        {n > 1 && <p className="text-xs text-white/60 mt-1">{index + 1} / {n}</p>}
      </div>
    </div>,
    document.body
  );
}
/* ─── Per-album section (no toggle, always fully visible) ───────────── */

function AlbumSection({ album }) {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let mounted = true;
    api.gallery.getAlbum(album.id).then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        setPhotos(Array.isArray(res.data.photos) ? res.data.photos : []);
        const cats = Array.isArray(res.data.categories)
          ? res.data.categories.map((c) => (typeof c === 'string' ? c : c.name))
          : [];
        setCategories(cats);
      }
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [album.id]);

  const categoryList = categories.length > 0 ? ['All', ...categories] : [];

  const displayed =
    activeCategory === 'All'
      ? photos
      : photos.filter(
          (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
        );

  const categoryCount = (cat) =>
    cat === 'All'
      ? photos.length
      : photos.filter(
          (p) => p.category?.toLowerCase() === cat.toLowerCase()
        ).length;
        
  const [lightboxId, setLightboxId] = useState(null);
  const viewable = displayed.filter((p) => getPhotoSrc(p));

  return (
    <section className="space-y-6">
      {/* ── Album header ── */}
      <div className="border-b border-[#F3DEDA] pb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {album.camp_year && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#981B24]/10 text-[#981B24] border border-[#981B24]/20">
              {album.camp_year}
            </span>
          )}
          {album.camp_title && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {album.camp_title}
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B46] tracking-tight">
          {album.title}
        </h2>

        {album.description && (
          <p className="text-xs sm:text-sm text-[#68717D] mt-1.5 max-w-2xl leading-relaxed">
            {album.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-5 mt-3 text-xs text-[#68717D]">
          {album.camp_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#981B24]" />
              {formatCampDate(album.camp_date)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#981B24]" />
            {album.photo_count || photos.length} Photos
          </span>
          {categories.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {categories.length} Categories
            </span>
          )}
        </div>
      </div>

      {/* ── Category pills (only if album has categories) ── */}
      {!loading && categoryList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categoryList.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              count={categoryCount(cat)}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-[#FAF4EB] animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Photo grid ── */}
      {!loading && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-x-4 sm:gap-x-5">
          {displayed.length > 0 ? (
            displayed.map((p) => <PhotoCard key={p.id} photo={p} onOpen={() => setLightboxId(p.id)} />)
          ) : (
            <div className="col-span-full py-14 text-center text-slate-400 text-xs sm:text-sm bg-[#FAF4EB] rounded-2xl border border-[#F3DEDA]">
              {activeCategory === 'All'
                ? 'Photographs for this album are being curated and will be uploaded soon.'
                : `No photos found under "${activeCategory}".`}
            </div>
          )}
        </div>
      )}
            {lightboxId !== null && (
        <GalleryLightbox
          photos={viewable}
          activeId={lightboxId}
          onChange={setLightboxId}
          onClose={() => setLightboxId(null)}
        />
      )}
    </section>
  );
}

/* ─── Main Gallery Page ──────────────────────────────────────────────── */

export default function GalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [cmsPages, setCmsPages] = useState(null);

  // Fetch the ordered list of published albums
  useEffect(() => {
    api.gallery.getAlbums({ limit: 100 }).then((res) => {
      setAlbums(Array.isArray(res.data?.albums) ? res.data.albums : []);
      setLoadingAlbums(false);
    }).catch(() => setLoadingAlbums(false));
  }, []);

  // CMS copy for hero
  useEffect(() => {
    api.content.getPages().then((res) => {
      if (res?.success && res.data) setCmsPages(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#981B24] text-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pt-16 pb-24 lg:pb-28 animate-fade-in-up">
          {(cmsPages?.gallery?.eyebrow ?? 'Gallery') && <p className="text-xs font-semibold tracking-widest uppercase text-[#F3DEDA] mb-3">{cmsPages?.gallery?.eyebrow ?? 'Gallery'}</p>}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {cmsPages?.gallery?.title || 'Moments That Matter'}
          </h1>
          <p className="text-[#F3DEDA] max-w-xl text-sm sm:text-base leading-relaxed">
            {cmsPages?.gallery?.description ||
              'Snapshots of compassion, community and lives changed through our blood donation campaigns.'}
          </p>
        </div>
        <HeroWave fill="#FFFDF9" />
      </section>

      {/* ── Content ── */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-12">

        {/* Loading skeleton */}
        {loadingAlbums && (
          <div className="space-y-16">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-5">
                <div className="space-y-2 border-b border-[#F3DEDA] pb-5">
                  <div className="h-6 w-56 bg-[#F3DEDA]/60 rounded-xl animate-pulse" />
                  <div className="h-4 w-80 bg-[#F3DEDA]/40 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="aspect-square rounded-2xl bg-[#FAF4EB] animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingAlbums && albums.length === 0 && (
          <div className="py-16 text-center">
            <div className="bg-[#FAF4EB] border border-[#F3DEDA] rounded-3xl p-10 max-w-lg mx-auto shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-[#981B24] flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102B46] mb-1">Gallery Coming Soon</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cmsPages?.gallery?.emptyMessage ||
                  'Moments and photographs from our blood donation drives will be published here shortly.'}
              </p>
            </div>
          </div>
        )}

        {/* Albums — one section per album, in admin-defined order, no buttons */}
        {!loadingAlbums && albums.length > 0 && (
          <div className="space-y-20">
            {albums.map((album) => (
              <AlbumSection key={album.id} album={album} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
