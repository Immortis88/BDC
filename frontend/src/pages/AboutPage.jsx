import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, Droplet, Users, Calendar } from 'lucide-react';
import ImagePlaceholder from '../components/common/ImagePlaceholder.jsx';
import HeroWave from '../components/common/HeroWave.jsx';
import { useImpactData } from '../hooks/useImpactData.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { api } from '../services/api.js';

// Predefined photo slots for the three-photo introduction row
const DEFAULT_ABOUT_PHOTOS = [
  {
    id: 'about-photo-1',
    url: null, // Awaiting approved photo 1
    alt: 'Doctor and donor during blood donation',
    label: 'Camp Donor & Medical Care',
    heightClass: 'h-[220px] sm:h-[260px] md:h-[250px] lg:h-[300px] xl:h-[330px]'
  },
  {
    id: 'about-photo-2',
    url: null, // Awaiting approved photo 2 (center, taller)
    alt: 'Student volunteers managing registrations',
    label: 'Student Volunteer Coordination',
    heightClass: 'h-[250px] sm:h-[300px] md:h-[300px] lg:h-[360px] xl:h-[400px]'
  },
  {
    id: 'about-photo-3',
    url: null, // Awaiting approved photo 3
    alt: 'BDC volunteer supporting donor initiative',
    label: 'BDC Volunteer Initiative',
    heightClass: 'h-[220px] sm:h-[260px] md:h-[250px] lg:h-[300px] xl:h-[330px]'
  }
];

const IMPACT_ICONS = {
  blood_units: Droplet,
  donors: Users,
  camps_organised: Calendar
};

function AboutImpactStatItem({ stat, isVisible, loading }) {
  const { displayValue } = useCountUp({
    value: stat.value,
    raw: stat.raw,
    enabled: isVisible && !loading,
    duration: 1800
  });

  const IconComponent = IMPACT_ICONS[stat.id] || Droplet;

  return (
    <div className="relative flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Icon in subtle circular badge */}
      <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mb-3.5 shadow-2xs">
        <IconComponent className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Screen-reader accessible final value */}
      <span className="sr-only">
        {stat.value} {stat.label}
      </span>

      {/* Visual animated numeral with tabular digits */}
      <p
        aria-hidden="true"
        className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-none mb-2 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none"
      >
        {displayValue}
      </p>

      {/* Visual smaller label */}
      <p
        aria-hidden="true"
        className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/90 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
      >
        {stat.label}
      </p>
    </div>
  );
}

export default function AboutPage({
  heroPhotoUrl = null,
  aboutPhotos = DEFAULT_ABOUT_PHOTOS,
  previewData = null
}) {
  const { impactStats, loading } = useImpactData();
  const [cmsData, setCmsData] = useState(previewData);

  useEffect(() => {
    if (previewData) {
      setCmsData(previewData);
    }
  }, [previewData]);

  useEffect(() => {
    if (previewData) return;
    let mounted = true;
    api.content.getAbout().then(res => {
      if (mounted && res.success && res.data) {
        setCmsData(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [previewData]);

  // Section 5 (Our Impact) Intersection Observer — runs once per mount
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

  const effectiveHeroPhoto = cmsData?.hero?.heroPhotoUrl ?? heroPhotoUrl;
  const effectivePhotos = cmsData?.photos?.length ? aboutPhotos.map((p, i) => ({
    ...p,
    url: cmsData.photos[i]?.url ?? p.url,
    alt: cmsData.photos[i]?.alt || p.alt,
    label: cmsData.photos[i]?.label || p.label
  })) : aboutPhotos;

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-[#981B24] text-white">
        {effectiveHeroPhoto && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
            <img
              src={effectiveHeroPhoto}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#981B24]/85 mix-blend-multiply" />
          </div>
        )}

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pt-16 pb-24 lg:pb-28 animate-fade-in-up">
          <p className="text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-3">
            {cmsData?.hero?.eyebrow || 'About BDC'}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-4 max-w-3xl">
            {cmsData?.hero?.headline || 'A student initiative for a healthier tomorrow.'}
          </h1>
          <p className="text-[#F3DEDA] max-w-xl text-sm sm:text-base leading-relaxed">
            {cmsData?.hero?.description || 'The Blood Donation Campaign at SKIT is a student-led initiative dedicated to spreading awareness and contributing towards a healthier, stronger community through voluntary blood donation.'}
          </p>
        </div>
        <HeroWave fill="#FFFDF9" />
      </section>

      {/* Main Content Area */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">

        {/* 2. Three-photo introduction */}
        <section aria-label="Campaign highlights in photos" className="pt-10 sm:pt-14 lg:pt-16 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-center">
            {effectivePhotos.map((photo) => (
              <div key={photo.id} className="w-full">
                {photo.url ? (
                  <div
                    className={`relative w-full overflow-hidden rounded-2xl lg:rounded-3xl border border-[#EAD7CF] shadow-xs ${photo.heightClass}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: photo.focalPosition || 'center' }}
                    />
                  </div>
                ) : (
                  <div className={`w-full ${photo.heightClass}`}>
                    <ImagePlaceholder
                      className="w-full h-full rounded-2xl lg:rounded-3xl shadow-2xs"
                      iconClassName="w-8 sm:w-10 h-8 sm:h-10"
                      label={photo.label}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Our Story */}
        <section className="py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <p className="text-xs font-bold tracking-widest uppercase text-[#981B24] mb-2 sm:mb-2.5">
              {cmsData?.story?.eyebrow || 'OUR STORY'}
            </p>
            <h2 className="font-serif text-3xl sm:text-[34px] lg:text-[40px] font-bold text-[#102B46] tracking-tight leading-[1.15]">
              {cmsData?.story?.headline || 'Built by students, for the community.'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto text-sm sm:text-base text-[#4A5568] leading-relaxed">
            <p>
              {cmsData?.story?.paragraph1 || (
                <>
                  The <strong className="font-semibold text-[#102B46]">Blood Donation Campaign (BDC) at SKIT</strong> is a
                  student-driven initiative to create awareness about voluntary blood donation and to
                  contribute towards a healthier, stronger community. What started as a single campus
                  drive has grown into a recurring program, bringing together student coordinators,
                  volunteers, and donors from across the institute.
                </>
              )}
            </p>
            <p>
              {cmsData?.story?.paragraph2 || (
                <>
                  Every camp is organised entirely by students — from outreach and registration to
                  on-ground logistics and partner coordination — under the guidance of faculty
                  advisors and NSS SKIT Jaipur. Through collective effort and compassion, BDC
                  continues to inspire more people to donate blood and make a difference in the
                  lives of those in need.
                </>
              )}
            </p>
          </div>
        </section>

        {/* 4. Mission, Vision & Values */}
        <section className="py-12 sm:py-16">
          <div className="bg-[#FDF3EF] border border-[#F3DEDA] rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-xs">
            <div className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-bold tracking-widest uppercase text-[#981B24] mb-2 sm:mb-2.5">
                WHAT DRIVES US
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#102B46] tracking-tight">
                Mission, Vision &amp; Values
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-[#EAD7CF]">
              {/* Our Mission */}
              <div className="md:px-6 lg:px-8 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0 mb-4 shadow-2xs">
                  <Target className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#102B46] mb-2">
                  {cmsData?.values?.mission?.title || 'Our Mission'}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {cmsData?.values?.mission?.description || 'To create sustained awareness about voluntary blood donation and ensure a reliable, safe blood supply for the community around SKIT.'}
                </p>
              </div>

              {/* Our Vision */}
              <div className="md:px-6 lg:px-8 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0 mb-4 shadow-2xs">
                  <Eye className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#102B46] mb-2">
                  {cmsData?.values?.vision?.title || 'Our Vision'}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {cmsData?.values?.vision?.description || 'A campus culture where regular blood donation is second nature — building a healthier, stronger community one camp at a time.'}
                </p>
              </div>

              {/* Our Values */}
              <div className="md:px-6 lg:px-8 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0 mb-4 shadow-2xs">
                  <Heart className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#102B46] mb-2">
                  {cmsData?.values?.values?.title || 'Our Values'}
                </h3>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {cmsData?.values?.values?.description || 'Selfless service, student leadership, and community upliftment — the same values inspired by Swami Keshvanand.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Our Impact (Reusing shared homepage data and dark-red photographic styling) */}
      <section
        ref={impactSectionRef}
        aria-label="Our Impact Statistics"
        className="relative z-10 w-full overflow-hidden bg-[#5A040B] text-white py-16 sm:py-20 lg:py-24"
      >
        {/* Full-width photographic background layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <img
            src="/assets/bdc_impact_slightly_bright_webp.webp"
            alt=""
            role="presentation"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle contrast overlay to enhance text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">
          <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-white/90 text-center mb-10 sm:mb-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            OUR IMPACT
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x sm:divide-white/20 max-w-5xl mx-auto text-center items-center">
            {impactStats.map((s) => (
              <AboutImpactStatItem
                key={s.id || s.label}
                stat={s}
                isVisible={impactInView}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Closing CTA */}
      <section className="bg-[#981B24] text-white border-t border-[#7E141C]/80">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-6 sm:py-7 lg:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-2">
              {cmsData?.cta?.eyebrow || 'BE A LIFESAVER'}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-snug">
              {cmsData?.cta?.headline || 'Join us at the next camp.'}
            </h2>
          </div>
          <Link
            to={cmsData?.cta?.buttonUrl || '/register'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-[#981B24] hover:bg-[#FFF9F2] transition shrink-0 self-start sm:self-auto shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>{cmsData?.cta?.buttonLabel || 'Register Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
