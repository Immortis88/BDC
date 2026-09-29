import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Users, User, Calendar, MapPin, Droplet, RefreshCw, Bell } from 'lucide-react';
import ImagePlaceholder from '../components/common/ImagePlaceholder.jsx';
import GalleryCarousel from '../components/home/GalleryCarousel.jsx';
import PartnersLogoStrip from '../components/home/PartnersLogoStrip.jsx';
import HomeFaqSection from '../components/home/HomeFaqSection.jsx';
import { useImpactData } from '../hooks/useImpactData.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { useFeaturedCamp } from '../hooks/useFeaturedCamp.js';
import { subscribeToCampUpdates } from '../utils/campEvents.js';
import { api } from '../services/api.js';

/**
 * Format YYYY-MM-DD cleanly using full month name without timezone shifts.
 * e.g., "2026-11-24" -> "24 November 2026"
 */
function formatCampDate(campDateStr) {
  if (!campDateStr || typeof campDateStr !== 'string') return null;
  const match = campDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
      return `${day} ${monthNames[monthIndex]} ${year}`;
    }
  }
  return null;
}

const GALLERY_PREVIEW_COUNT = 4;

const INSPIRATION_CONTENT = {
  sectionLabel: 'Our Inspiration',
  name: 'Swami Keshvanand',
  description: 'A legacy of education, selfless service and community upliftment.',
  closingStatement: 'Values for a Better Tomorrow.',
  slogansLeft: ['Education', 'Service', 'Society', 'Self Reliance'],
  slogansRight: ['Individual', 'Development', 'Leads To', 'A Stronger', 'Nation'],
  portraitAlt: 'Swami Keshvanand'
};

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase text-[#B30E1F] mb-2 text-center">
      {children}
    </p>
  );
}

function ImpactStatItem({ stat, isVisible, loading }) {
  const { displayValue } = useCountUp({
    value: stat.value,
    raw: stat.raw,
    enabled: isVisible && !loading,
    duration: 1800
  });

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      {/* Screen-reader accessible final value (never ticks intermediate frames) */}
      <span className="sr-only">
        {stat.value} {stat.label}
      </span>

      {/* Visual animated numeral with tabular digits to prevent layout shifting */}
      <p
        aria-hidden="true"
        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-none mb-2 sm:mb-3 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none"
      >
        {displayValue}
      </p>

      {/* Visual smaller label */}
      <p
        aria-hidden="true"
        className="text-xs sm:text-sm font-semibold tracking-wider text-white/90 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
      >
        {stat.label}
      </p>
    </div>
  );
}

import { DEFAULT_HERO_SLIDES } from '../services/heroSlides.js';
export { DEFAULT_HERO_SLIDES };

function getSlogans(slogans, fallback) {
  if (Array.isArray(slogans) && slogans.length > 0) return slogans;
  if (typeof slogans === 'string' && slogans.trim()) {
    const list = slogans.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0) return list;
  }
  return fallback;
}

export default function HomePage({
  heroSlides = DEFAULT_HERO_SLIDES,
  heroImageUrl, // Preserved for legacy prop compatibility
  heroImageFocalPosition,
  heroImageAlt,
  aboutImageUrl = null, // Set to URL when original asset is provided
  aboutImageAlt = 'SKIT blood donation camp volunteers and donor',
  impactBannerUrl = '/assets/bdc_impact_slightly_bright_webp.webp',
  previewData = null
}) {
  const rawSlides = (heroSlides && heroSlides.length > 0)
    ? heroSlides
    : heroImageUrl
      ? [{
          id: 'legacy-hero-1',
          imageUrl: heroImageUrl,
          focalPosition: heroImageFocalPosition || 'right 20%',
          alt: heroImageAlt || 'Student donating blood at SKIT Blood Donation Camp'
        }]
      : [];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState({});
  const { heroStat, impactStats, loading } = useImpactData();
  const { data: featuredCamp, isLoading, isError, refetch } = useFeaturedCamp();

  const isRegistrationOpen = !isError && !isLoading && featuredCamp?.is_registration_available === true;
  const registerHref = `/register${featuredCamp?._id ? `?camp_id=${featuredCamp._id}` : ''}`;
  const heroCtaLabel = isRegistrationOpen
    ? 'Register Now'
    : (isError || isLoading)
      ? 'Register Now'
      : 'Registration Closed';

  const [chiefCoordinator, setChiefCoordinator] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [partners, setPartners] = useState([]);
  const [cmsHome, setCmsHome] = useState(previewData);
  const [isCmsLoading, setIsCmsLoading] = useState(!previewData);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (previewData) {
      setCmsHome(previewData);
    }
  }, [previewData]);

  const effectiveSlogansLeft = getSlogans(cmsHome?.inspiration?.slogansLeft, INSPIRATION_CONTENT.slogansLeft);
  const effectiveSlogansRight = getSlogans(cmsHome?.inspiration?.slogansRight, INSPIRATION_CONTENT.slogansRight);

  useEffect(() => {
    let mounted = true;

    const loadContent = () => {
      // Load CMS Homepage (skip if in preview mode)
      if (!previewData) {
        api.content.getHomepage().then((res) => {
          if (!mounted) return;
          if (res?.success && res.data) {
            setCmsHome(res.data);
          }
          setIsCmsLoading(false);
        }).catch(() => {
          if (mounted) setIsCmsLoading(false);
        });
      }

      // Load Notices
      api.content.getNotices().then((res) => {
        if (!mounted || !res?.success || !Array.isArray(res.data)) return;
        setNotices(res.data);
      }).catch(() => {});

      // Load team
      api.team.getAll().then((res) => {
        if (!mounted) return;
        if (!res?.success || !res.data) {
          setChiefCoordinator(null);
          setTeamMembers([]);
          return;
        }
        if (res.data.chiefCoordinators?.length > 0) {
          const c = res.data.chiefCoordinators[0];
          setChiefCoordinator({
            name: c.name,
            role: c.role || '',
            image: c.photoUrl && !c.photoUrl.startsWith('data:') ? c.photoUrl : null
          });
        } else {
          setChiefCoordinator(null);
        }
        setTeamMembers((res.data.members || []).slice(0, 4).map(m => ({
          name: m.name,
          image: m.photoUrl && !m.photoUrl.startsWith('data:') ? m.photoUrl : null
        })));
      }).catch(() => {
        if (mounted) {
          setChiefCoordinator(null);
          setTeamMembers([]);
        }
      });

      // Load gallery photos from published albums for homepage carousel
      api.gallery.getAll().then((res) => {
        if (!mounted) return;
        const list = res?.data?.carouselPhotos || res?.data?.photos || [];
        const photos = Array.isArray(list) ? list : [];
        setGalleryPhotos(photos.map(p => ({
          id: `photo-${p.id}`,
          src: p.photoUrl || p.photo_url || p.image_url,
          alt: p.alt_text || p.caption || 'BDC camp moment'
        })));
      }).catch(() => { if (mounted) setGalleryPhotos([]); });

      // Load sponsors / partners
      api.sponsors.getAll().then((res) => {
        if (!mounted) return;
        if (!res?.success || !Array.isArray(res.data)) {
          setPartners([]);
          return;
        }
        const allSponsors = res.data.flatMap(sec => sec.sponsors || []);
        setPartners(allSponsors.map(s => ({
          id: `partner-${s.id}`,
          name: s.name,
          logo: s.logoUrl || s.logo_url
        })));
      }).catch(() => {
        if (mounted) setPartners([]);
      });
    };

    loadContent();

    const unsubscribe = subscribeToCampUpdates(() => {
      if (mounted) loadContent();
    });

    const handleFocus = () => {
      if (mounted) loadContent();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Section 4 (Our Impact) Intersection Observer — runs once per mount
  const impactSectionRef = useRef(null);
  const [impactInView, setImpactInView] = useState(false);

  useEffect(() => {
    const el = impactSectionRef.current;
    if (!el || impactInView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setImpactInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setImpactInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [impactInView]);

  const cmsSlides = (cmsHome?.hero?.slides || []).map((s, idx) => ({
    id: s.id || `cms-slide-${idx}`,
    imageUrl: s.imageUrl || s.image_url,
    focalPosition: s.focalPosition || 'right 20%',
    alt: s.alt || 'Student donating blood at SKIT Blood Donation Camp'
  })).filter(s => Boolean(s.imageUrl));

  // While CMS is loading, do not render the static fallback AI image.
  // Wait until API data arrives; only fall back if CMS has finished loading with 0 slides.
  const effectiveSlides = isCmsLoading
    ? []
    : (cmsSlides.length > 0 ? cmsSlides : rawSlides);

  // Filter out slides with empty URLs or load failures
  const validSlides = effectiveSlides.filter(
    (slide) => Boolean(slide.imageUrl) && !failedImageUrls[slide.imageUrl]
  );

  const activeIndex = validSlides.length > 0
    ? (currentSlideIndex < validSlides.length ? currentSlideIndex : 0)
    : 0;

  const currentSlide = validSlides[activeIndex] || null;
  const showHeroImage = Boolean(currentSlide?.imageUrl);

  useEffect(() => {
    setHeroImageLoaded(false);
  }, [currentSlide?.imageUrl]);

  const handlePrevSlide = () => {
    if (validSlides.length < 2) return;
    setCurrentSlideIndex((prev) => (prev === 0 ? validSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (validSlides.length < 2) return;
    setCurrentSlideIndex((prev) => (prev === validSlides.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (url) => {
    if (!url) return;
    setFailedImageUrls((prev) => ({ ...prev, [url]: true }));
  };

  const showTeamSection = !isLoading && featuredCamp?.visibility?.team !== false &&
    Boolean(chiefCoordinator || teamMembers.length > 0);
  const showSponsorsSection = !isLoading && featuredCamp?.visibility?.sponsors !== false &&
    partners.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF4EB]">
      {/* Notices & Announcements Strip (Shown only when enabled notices exist) */}
      {notices.length > 0 && (
        <div className="bg-[#B91C1C] text-white px-4 py-2 sm:px-6 shadow-xs relative z-30">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1 rounded bg-white/20 text-white shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">{notices[0].text}</span>
            </div>
            {notices[0].linkUrl && (
              <Link
                to={notices[0].linkUrl}
                className="shrink-0 inline-flex items-center gap-1 font-bold underline hover:no-underline text-white/95"
              >
                <span>{notices[0].linkLabel || 'Learn More'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ===== Hero Section ===== */}
      <section className="relative bg-[#FAF4EB] pb-6 sm:pb-8 lg:pb-8">
        {/* Clipped Hero Image Layer (Independent layer ending ~1/3 down into Current Camp card) */}
        <div
          className="absolute top-0 left-0 right-0 bottom-[120px] sm:bottom-[125px] lg:bottom-[130px] overflow-hidden pointer-events-none select-none z-0"
          aria-hidden={!showHeroImage}
        >
          {/* Subtle cream skeleton while image is loading */}
          {(!showHeroImage || !heroImageLoaded) && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF4EB] via-[#F3ECE2] to-[#FAF4EB] animate-pulse" />
          )}

          {showHeroImage && (
            <div className="relative w-full h-[calc(100%+120px)] sm:h-[calc(100%+125px)] lg:h-[calc(100%+130px)]">
              {/* Admin-Uploaded / Managed Photo (Scale and position preserved) */}
              <img
                key={currentSlide.id || currentSlide.imageUrl}
                src={currentSlide.imageUrl}
                alt={currentSlide.alt || 'Student donating blood at SKIT Blood Donation Camp'}
                fetchPriority="high"
                decoding="async"
                onLoad={() => setHeroImageLoaded(true)}
                onError={() => handleImageError(currentSlide.imageUrl)}
                className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${
                  heroImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ objectPosition: currentSlide.focalPosition || 'right 20%' }}
              />

              {/* Single smooth, multi-stop cream overlay from midpoint of Home (42%) to right edge of About (54%) */}
              <div
                className="hidden md:block absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    'linear-gradient(90deg, #FAF4EB 0%, #FAF4EB 42%, rgba(250, 244, 235, 0.88) 44%, rgba(250, 244, 235, 0.60) 46.5%, rgba(250, 244, 235, 0.30) 49%, rgba(250, 244, 235, 0.10) 51.5%, rgba(250, 244, 235, 0.03) 53%, rgba(250, 244, 235, 0) 54%)'
                }}
                aria-hidden="true"
              />

              {/* Mobile/tablet backdrop fade for text contrast */}
              <div
                className="md:hidden absolute inset-0 bg-gradient-to-b from-[#FAF4EB] via-[#FAF4EB]/85 to-transparent pointer-events-none z-10"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Hero Content (Positioned at ~10% left margin on desktop, compact vertical spacing) */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[10%] pt-7 sm:pt-9 lg:pt-11 pb-8 sm:pb-10 lg:pb-10">
          <div className="max-w-md lg:max-w-[480px] xl:max-w-[520px] animate-fade-in-up">
            {/* Category / Institutional tag */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5">
              {cmsHome?.hero?.eyebrow || 'SKIT JAIPUR · BLOOD DONATION CAMPAIGN'}
            </p>

            {/* Main Headline in Lora Serif */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] xl:text-[66px] font-bold tracking-tight text-[#031B44] leading-[1.08] mb-3">
              {cmsHome?.hero?.headline ? (
                <span className="block">{cmsHome.hero.headline}</span>
              ) : (
                <>
                  Donate blood.<br />
                  <span className="text-[#B30E1F]">Carry hope.</span>
                </>
              )}
            </h1>

            {/* Supporting text strictly constrained to 2 lines */}
            <p className="text-[#4A5568] text-base sm:text-[17px] lg:text-[18px] leading-relaxed mb-5 max-w-[340px] sm:max-w-[400px]">
              {cmsHome?.hero?.subheadline || cmsHome?.hero?.description || (
                <>
                  A small act from you can give<br className="hidden sm:inline" /> someone a second chance at life.
                </>
              )}
            </p>

            {/* Action buttons with strengthened Our Journey outline */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 mb-5">
              {isRegistrationOpen ? (
                <Link
                  to={registerHref}
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold bg-[#B30E1F] text-white hover:bg-[#990A18] shadow-sm hover:shadow transition-all group"
                >
                  <span>{cmsHome?.hero?.primaryCtaLabel || cmsHome?.hero?.ctaLabel || 'Register Now'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold bg-[#B30E1F] text-white shadow-sm cursor-not-allowed"
                >
                  <span>{cmsHome?.hero?.primaryCtaLabel || cmsHome?.hero?.ctaLabel || heroCtaLabel}</span>
                  {(isError || isLoading) && (
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              )}
              <Link
                to={cmsHome?.hero?.secondaryCtaUrl || cmsHome?.hero?.ctaUrl || '/about'}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold bg-[#FAF4EB] text-[#031B44] border-2 border-[#D2BCB0] hover:border-[#B30E1F] hover:bg-[#F3E5D8] shadow-2xs transition-colors"
              >
                <span>{cmsHome?.hero?.secondaryCtaLabel || 'Our Journey'}</span>
              </Link>
            </div>

            {/* Shared Impact Statistic (Synchronized with Our Impact data source) */}
            <div className="flex items-center gap-3.5 text-[#374151]">
              <div className="w-11 h-11 rounded-lg bg-[#FBEAE7] flex items-center justify-center shrink-0" aria-hidden="true">
                <Users className="w-5.5 h-5.5 text-[#B30E1F]" strokeWidth={2.2} />
              </div>
              <div>
                <span className="font-bold text-[#031B44] text-lg sm:text-xl block leading-tight">
                  {heroStat.value}
                </span>
                <span className="text-xs sm:text-[14px] text-[#4A5568] block leading-tight mt-0.5 font-normal">
                  {heroStat.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Camp Banner Card with Carousel Controls Positioned Above It */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] relative z-20 mt-2 sm:mt-3 lg:mt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Carousel Controls (Positioned at photograph's lower-right, above Current Camp card) */}
          {validSlides.length >= 2 && (
            <div
              className="absolute right-4 sm:right-6 md:right-8 lg:right-[6%] bottom-full mb-3 sm:mb-3.5 z-30 flex items-center gap-3 select-none"
              role="region"
              aria-label="Hero carousel navigation"
            >
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                className="w-11 h-11 rounded-full bg-white text-[#031B44] shadow-md hover:bg-white/95 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-2 shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-[#031B44]" strokeWidth={2.2} aria-hidden="true" />
              </button>

              <span
                className="font-bold text-white text-sm sm:text-base tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] px-1 tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {activeIndex + 1} / {validSlides.length}
              </span>

              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Next slide"
                className="w-11 h-11 rounded-full bg-white text-[#031B44] shadow-md hover:bg-white/95 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F] focus-visible:ring-offset-2 shrink-0"
              >
                <ArrowRight className="w-5 h-5 text-[#031B44]" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="bg-[#FAF4EC] rounded-2xl border border-[#EAD7CF] shadow-md p-5 sm:p-6 lg:pl-[2.2%] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            {isLoading && !featuredCamp && !isError ? (
              /* Loading State */
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-1.5">Current Camp</p>
                    <div className="h-7 sm:h-8 w-60 max-w-full bg-[#EAD7CF]/60 rounded-md motion-safe:animate-pulse" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Calendar className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <div className="h-4 w-28 bg-[#EAD7CF]/60 rounded motion-safe:animate-pulse mb-1" />
                        <div className="h-3 w-20 bg-[#EAD7CF]/40 rounded motion-safe:animate-pulse" />
                      </div>
                    </div>

                    <div className="hidden sm:block w-[1px] h-8 bg-[#E2D5CB] shrink-0" aria-hidden="true" />

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <MapPin className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <div className="h-4 w-36 bg-[#EAD7CF]/60 rounded motion-safe:animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-[#EAD7CF]/40 rounded motion-safe:animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#B30E1F] text-white shadow-xs shrink-0 self-start lg:self-end cursor-not-allowed"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : isError ? (
              /* Request Failure State */
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-1.5">Current Camp</p>
                    <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-bold text-[#031B44] tracking-tight leading-tight">
                      Camp details temporarily unavailable.
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Calendar className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#031B44] leading-tight">Date not provided</p>
                        <p className="text-[11px] sm:text-xs text-[#5A626E] leading-tight mt-0.5">Time not provided</p>
                      </div>
                    </div>

                    <div className="hidden sm:block w-[1px] h-8 bg-[#E2D5CB] shrink-0" aria-hidden="true" />

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <MapPin className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#031B44] leading-tight">Venue not provided</p>
                        <p className="text-[11px] sm:text-xs leading-tight mt-0.5 invisible select-none" aria-hidden="true">&nbsp;</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#B30E1F] text-white hover:bg-[#990A18] transition shadow-xs shrink-0 self-start lg:self-end cursor-pointer"
                >
                  <span>Retry</span>
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Success State: Either Live Camp or No Active Camp Listed */
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-1.5">Current Camp</p>
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-bold text-[#031B44] tracking-tight leading-tight">
                        {featuredCamp?.name?.trim() || 'No active camp is currently listed.'}
                      </h3>
                      {isRegistrationOpen && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#D1ECD2] text-[#166534] border border-[#BBE3BD]">
                          Registration Open
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Calendar className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#031B44] leading-tight">
                          {formatCampDate(featuredCamp?.camp_date) || 'Date not provided'}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#5A626E] leading-tight mt-0.5">
                          {featuredCamp?.camp_time?.trim() || 'Time not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block w-[1px] h-8 bg-[#E2D5CB] shrink-0" aria-hidden="true" />

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-[#F5ECE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        <MapPin className="w-4 h-4 text-[#B30E1F]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#031B44] leading-tight">
                          {featuredCamp?.venue?.trim() || 'Venue not provided'}
                        </p>
                        {featuredCamp?.venue_sub?.trim() ? (
                          <p className="text-[11px] sm:text-xs text-[#5A626E] leading-tight mt-0.5">
                            {featuredCamp.venue_sub.trim()}
                          </p>
                        ) : (
                          <p className="text-[11px] sm:text-xs leading-tight mt-0.5 invisible select-none" aria-hidden="true">
                            &nbsp;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {isRegistrationOpen ? (
                  <Link
                    to={registerHref}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#B30E1F] text-white hover:bg-[#990A18] transition shadow-xs shrink-0 self-start lg:self-end"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-[#B30E1F] text-white shadow-xs shrink-0 self-start lg:self-end cursor-not-allowed"
                  >
                    <span>Registration Closed</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== About BDC (Section 3) ===== */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">
        <section className="py-10 sm:py-12 lg:py-14 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
          {/* Centered Content Column */}
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5">
              {cmsHome?.about?.eyebrow || 'ABOUT BDC'}
            </p>
            <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight mb-4">
              {(cmsHome?.about?.heading || cmsHome?.about?.headline) ? (
                <span className="block">{cmsHome?.about?.heading || cmsHome?.about?.headline}</span>
              ) : (
                <>A student initiative<br className="hidden sm:inline" /> for a healthier tomorrow.</>
              )}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4A5568] leading-relaxed mb-6 max-w-[490px] mx-auto">
              {cmsHome?.about?.body1 || cmsHome?.about?.description || (
                <>The <strong className="font-semibold text-[#1F2937]">Blood Donation Campaign (BDC) at SKIT</strong> is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community.</>
              )}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#FAF4EB] text-[#031B44] border-2 border-[#D2BCB0] hover:border-[#B30E1F] hover:bg-[#F3E5D8] shadow-2xs transition-colors"
            >
              <span>Discover BDC</span>
            </Link>
          </div>

          {/* Landscape Image Area (5:3 Aspect Ratio) */}
          <div className="w-full">
            {(cmsHome?.about?.imageUrl || aboutImageUrl) ? (
              <div className="w-full aspect-[5/3] rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={cmsHome?.about?.imageUrl || aboutImageUrl}
                  alt={aboutImageAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <ImagePlaceholder
                className="w-full aspect-[5/3] rounded-2xl shadow-2xs"
                iconClassName="w-10 h-10"
                label="About photo (5:3 landscape)"
              />
            )}
          </div>
        </section>
      </div>

      {/* ===== Our Impact (Section 4) ===== */}
      <section
        ref={impactSectionRef}
        aria-label="Our Impact Statistics"
        className="relative z-10 w-full overflow-hidden bg-[#5A040B] text-white py-16 sm:py-20 lg:py-24"
      >
        {/* Full-width photographic background layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <img
            src={impactBannerUrl}
            alt=""
            role="presentation"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle contrast overlay to enhance text readability without doubling red tint */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">
          <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-white/90 text-center mb-10 sm:mb-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            Our Impact
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-white/20 max-w-5xl mx-auto text-center items-center">
            {impactStats.map((s) => (
              <ImpactStatItem
                key={s.id || s.label}
                stat={s}
                isVisible={impactInView}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Gallery: Moments That Matter (Section 5) ===== */}
      {galleryPhotos.length > 0 && (
      <section aria-label="Campaign Gallery" className="py-12 sm:py-14 lg:py-16 overflow-hidden">
        {/* Section Header */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] text-center mb-6 sm:mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5">
            GALLERY
          </p>
          <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight">
            Moments That Matter
          </h2>
        </div>

        {/* Horizontally moving stacked-photo carousel */}
        <GalleryCarousel photos={galleryPhotos} />

        {/* View full gallery action */}
        <div className="text-center mt-4 sm:mt-5">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition"
          >
            <span>View full gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
      )}

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">

        {showTeamSection && (
          <section aria-label="Our Team" className="py-12 sm:py-14 lg:py-16">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5">
              OUR TEAM
            </p>
            <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight">
              The People Behind the Campaign
            </h2>
          </div>

          {/* Row 1: Chief Coordinator alone, centered */}
          {chiefCoordinator && (
            <div className="flex flex-col items-center text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#F3DEDA] border-2 border-white shadow-xs flex items-center justify-center shrink-0">
              {chiefCoordinator.image ? (
                <img
                  src={chiefCoordinator.image}
                  alt={chiefCoordinator.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 sm:w-11 sm:h-11 text-[#C9A8A0]" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-base sm:text-lg font-bold text-[#031B44] mt-3 sm:mt-3.5 leading-snug">
              {chiefCoordinator.name}
            </p>
            {chiefCoordinator.role ? (
              <p className="text-xs sm:text-sm font-medium text-[#68717D] mt-0.5">
                {chiefCoordinator.role}
              </p>
            ) : null}
            </div>
          )}

          {/* Row 2: Four Members with equal spacing and aligned portraits/names */}
          <div className="max-w-xs sm:max-w-sm lg:max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 items-start">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#F3DEDA] border-2 border-white shadow-xs mb-3 flex items-center justify-center shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 sm:w-9 sm:h-9 text-[#C9A8A0]" strokeWidth={1.5} />
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[#031B44] leading-snug">
                    {member.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Meet the full team action: Lower-right on desktop, centered below grid on mobile */}
            <div className="mt-8 sm:mt-10 flex justify-center lg:justify-end">
              <Link
                to="/team"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition-colors group"
              >
                <span>Meet the full team</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          </section>
        )}
      </div>

      {/* ===== Our Partners (Section 7) ===== */}
      {showSponsorsSection && (
        <section
          aria-label="Our Partners"
          className="w-full bg-[#FDF3EF] py-12 sm:py-14 lg:py-16 overflow-hidden"
        >
        {/* Centered Section Header */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] text-center mb-8 sm:mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2 sm:mb-2.5">
            OUR PARTNERS
          </p>
          <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.15] tracking-tight">
            Our Valued Partners
          </h2>
        </div>

        {/* Widened moving strip: nearly full page width with ~3.5% side margins on desktop */}
        <div className="w-full px-4 sm:px-6 lg:px-[3.5%] overflow-hidden">
          <PartnersLogoStrip partners={partners} />
        </div>

        {/* Centered View all partners action */}
        <div className="text-center mt-4 sm:mt-5">
          <Link
            to="/supporters"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B30E1F] hover:text-[#990A18] transition-colors group"
          >
            <span>View all partners</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
        </section>
      )}

      {/* ===== Our Inspiration (Section 8) ===== */}
      <section
        aria-label="Our Inspiration"
        className="relative z-10 w-full overflow-hidden bg-[#F8E9DA] pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-12 lg:pb-14"
      >
        {/* Main Composition Container */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">
          
          {/* Mobile Top Slogan (Left Slogans Row) */}
          <div className="lg:hidden flex flex-col items-center gap-1.5 mb-6 select-none text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#5A626E]">
              {effectiveSlogansLeft.map((slogan, idx) => (
                <React.Fragment key={slogan}>
                  <span>{slogan}</span>
                  {idx < effectiveSlogansLeft.length - 1 && (
                    <span className="text-[#B30E1F]" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="w-6 h-[2px] bg-[#B30E1F] mt-0.5" aria-hidden="true" />
          </div>

          {/* Desktop 4-Column Layout */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 xl:gap-10">

            {/* 1. Left Slogan Area (Desktop) */}
            <div className="hidden lg:flex flex-col items-start shrink-0 select-none">
              <div className="space-y-1.5">
                {effectiveSlogansLeft.map((slogan) => (
                  <p
                    key={slogan}
                    className="text-[11px] xl:text-xs font-bold tracking-[0.22em] uppercase text-[#5A626E] leading-snug"
                  >
                    {slogan}
                  </p>
                ))}
              </div>
              <div className="w-6 h-[2px] bg-[#B30E1F] mt-3" aria-hidden="true" />
            </div>

            {/* 2. Portrait and Arch Frame with Flanking Botanicals */}
            <div className="relative shrink-0 flex items-center justify-center my-2 lg:my-0">
              {/* Botanical Branch (Left) - pale, low-contrast */}
              <img
                src="/assets/inspiration_botanical_left.png"
                alt=""
                aria-hidden="true"
                className="absolute -left-6 sm:-left-8 lg:-left-9 bottom-1 h-[75%] w-auto object-contain pointer-events-none select-none z-0 opacity-30"
              />

              {/* Botanical Branch (Right) - pale, low-contrast */}
              <img
                src="/assets/inspiration_botanical_right.png"
                alt=""
                aria-hidden="true"
                className="absolute -right-6 sm:-right-8 lg:-right-9 bottom-1 h-[75%] w-auto object-contain pointer-events-none select-none z-0 opacity-30"
              />

              {/* Arch Frame Wrapper */}
              <div className="relative w-[210px] sm:w-[240px] lg:w-[260px] xl:w-[280px] aspect-[627/593] flex items-center justify-center z-10">
                {/* Ornamental Arch Graphic (Muted beige-gold, cleaned borders) */}
                <img
                  src="/assets/inspiration_arch.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                />

                {/* Swami Keshvanand Portrait (Figure occupies ~82% of interior height, base aligns with arch base) */}
                <img
                  src="/assets/inspiration_swamiji.png"
                  alt={INSPIRATION_CONTENT.portraitAlt}
                  className="absolute bottom-[1.5%] left-1/2 -translate-x-1/2 h-[82%] w-auto object-contain z-20 select-none drop-shadow-sm opacity-100"
                />
              </div>
            </div>

            {/* 3. Main Text Area with Thin Crimson Vertical Divider */}
            <div className="flex items-center gap-5 sm:gap-6 lg:gap-7 flex-1 max-w-[430px] xl:max-w-[460px]">
              {/* Thin Crimson Vertical Divider with Small Top Dot */}
              <div className="hidden lg:flex flex-col items-center shrink-0 self-stretch py-1.5" aria-hidden="true">
                <div className="w-1.5 h-1.5 rounded-full bg-[#B30E1F] shrink-0" />
                <div className="w-[1.5px] flex-1 bg-[#B30E1F]/80 my-1 min-h-[115px]" />
              </div>

              {/* Main Text Content (Constrained width so description wraps naturally) */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-xs sm:text-[13px] font-bold tracking-[0.2em] uppercase text-[#B30E1F] mb-1.5 sm:mb-2">
                  {cmsHome?.inspiration?.eyebrow || INSPIRATION_CONTENT.sectionLabel}
                </p>
                <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-[#031B44] leading-[1.12] tracking-tight mb-2.5 sm:mb-3">
                  {cmsHome?.inspiration?.heading || INSPIRATION_CONTENT.name}
                </h2>
                <p className="text-sm sm:text-[15px] lg:text-base text-[#4A5568] leading-relaxed mb-3 sm:mb-3.5 max-w-[340px] sm:max-w-[370px] mx-auto lg:mx-0">
                  {cmsHome?.inspiration?.description || INSPIRATION_CONTENT.description}
                </p>
                <div
                  className="w-8 h-[2px] bg-[#B30E1F] rounded-full mx-auto lg:mx-0 mb-3 sm:mb-3.5"
                  aria-hidden="true"
                />
                <p className="text-sm sm:text-base font-semibold text-[#031B44] tracking-tight">
                  {cmsHome?.inspiration?.quote || cmsHome?.inspiration?.closingStatement || INSPIRATION_CONTENT.closingStatement}
                </p>
              </div>
            </div>

            {/* 4. Right Slogan and Tree Area (Entirely outside the main text area) */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-7 shrink-0">
              {/* Restored Right Slogan */}
              <div className="flex flex-col items-start shrink-0 select-none">
                <div className="space-y-1.5">
                  {effectiveSlogansRight.map((word) => (
                    <p
                      key={word}
                      className="text-[11px] xl:text-xs font-bold tracking-[0.22em] uppercase text-[#5A626E] leading-snug"
                    >
                      {word}
                    </p>
                  ))}
                </div>
                <div className="w-6 h-[2px] bg-[#B30E1F] mt-3" aria-hidden="true" />
              </div>

              {/* Tree Decoration - Reduced to half visible width, pale, low-contrast, dedicated area */}
              <div className="w-[130px] xl:w-[155px] h-[160px] xl:h-[190px] shrink-0 pointer-events-none select-none opacity-25 xl:opacity-30">
                <img
                  src="/assets/inspiration_tree.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain object-bottom"
                />
              </div>
            </div>

          </div>

          {/* Mobile Bottom Slogan (Right Slogan) */}
          <div className="lg:hidden flex flex-col items-center gap-1.5 mt-5 select-none text-center">
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#5A626E]">
              Individual Development Leads to a Stronger Nation
            </p>
            <div className="w-6 h-[2px] bg-[#B30E1F] mt-0.5" aria-hidden="true" />
          </div>

        </div>

        {/* Bottom Smooth Crimson Wave SVG (Simple inline SVG, one smooth cubic Bézier path, full clearance) */}
        <div
          className="absolute bottom-0 left-0 right-0 w-full overflow-visible pointer-events-none select-none z-10 leading-none"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-6 sm:h-8 lg:h-9 block"
          >
            {/* Seamless transition fill below the wave matching FAQ section cream background */}
            <path
              d="M 0,30 C 140,44 260,46 380,32 C 500,18 620,18 760,34 C 900,50 1020,48 1160,30 C 1260,18 1360,20 1440,32 L 1440,60 L 0,60 Z"
              fill="#FCF7EE"
            />
            <path
              d="M 0,30 C 140,44 260,46 380,32 C 500,18 620,18 760,34 C 900,50 1020,48 1160,30 C 1260,18 1360,20 1440,32"
              fill="none"
              stroke="#B30E1F"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </section>

      {/* ===== Frequently Asked Questions (Section 9) ===== */}
      <HomeFaqSection />

      {/* ===== Final CTA (Section 10) ===== */}
      <section className="bg-[#981B24] text-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-6 sm:py-7 lg:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-2 sm:mb-2.5">
              {cmsHome?.ctaBand?.eyebrow || 'BE A LIFESAVER'}
            </p>
            <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[38px] xl:text-[40px] font-bold text-white tracking-tight leading-[1.15]">
              {cmsHome?.ctaBand?.heading ? (
                <span className="block">{cmsHome.ctaBand.heading}</span>
              ) : (cmsHome?.ctaBand?.headline1 || cmsHome?.ctaBand?.headline2) ? (
                <>
                  {cmsHome.ctaBand.headline1 && <span className="block">{cmsHome.ctaBand.headline1}</span>}
                  {cmsHome.ctaBand.headline2 && <span className="block">{cmsHome.ctaBand.headline2}</span>}
                </>
              ) : (
                <>
                  <span className="block">Your one small act.</span>
                  <span className="block">Someone’s tomorrow.</span>
                </>
              )}
            </h2>
          </div>
          {isRegistrationOpen ? (
            <Link
              to={cmsHome?.ctaBand?.buttonUrl || cmsHome?.ctaBand?.ctaUrl || registerHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-[#981B24] hover:bg-[#FFF9F2] transition shrink-0 self-start sm:self-auto shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#981B24]"
            >
              <span>{cmsHome?.ctaBand?.buttonLabel || cmsHome?.ctaBand?.ctaLabel || 'Register Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-[#981B24] transition shrink-0 self-start sm:self-auto shadow-xs cursor-not-allowed"
            >
              <span>{cmsHome?.ctaBand?.buttonLabel || heroCtaLabel}</span>
              {(isError || isLoading) && (
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
