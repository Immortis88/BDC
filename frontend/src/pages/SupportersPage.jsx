import React, { useState, useEffect } from 'react';
import HeroWave from '../components/common/HeroWave.jsx';
import { usePublicSponsors } from '../hooks/usePublicData.js';
import { api } from '../services/api.js';

function LogoCard({ name, logoUrl, website_url }) {
  const [imgError, setImgError] = useState(false);
  const showLogo = Boolean(logoUrl) && !imgError;

  const content = (
    <div
      className="group bg-white rounded-2xl border border-[#F3DEDA] flex items-center justify-center p-3 sm:p-4 shadow-xs hover:shadow-lg hover:border-[#981B24]/40 transition-all duration-300 text-center h-44 sm:h-52 w-full max-w-sm mx-auto"
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full max-h-36 sm:max-h-44 max-w-[92%] object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-base sm:text-lg font-bold text-[#102B46] tracking-tight line-clamp-2 px-3">
          {name}
        </span>
      )}
    </div>
  );

  if (website_url) {
    return (
      <a href={website_url} target="_blank" rel="noopener noreferrer" title={name} className="block w-full max-w-sm mx-auto">
        {content}
      </a>
    );
  }

  return content;
}

export default function SupportersPage() {
  const { data: sections = [], isLoading } = usePublicSponsors();
  const [cmsPages, setCmsPages] = useState(null);
  const eyebrow = cmsPages?.supporters?.eyebrow ?? 'Our Sponsors';
  const title = cmsPages?.supporters?.title ?? 'Partners in Saving Lives';
  const description = cmsPages?.supporters?.description ?? 'We are grateful to our sponsors for their generous support in making the Blood Donation Campaign possible. Together, we create a healthier, stronger community.';
  const emptyMessage = cmsPages?.supporters?.emptyMessage ?? 'There are currently no sponsors or partner organizations published for this campaign.';

  useEffect(() => {
    let mounted = true;
    api.content.getPages().then(res => {
      if (mounted && res?.success && res.data) {
        setCmsPages(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#981B24] text-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pt-16 pb-24 lg:pb-28 animate-fade-in-up">
          {eyebrow && <p className="text-xs font-semibold tracking-widest uppercase text-[#F3DEDA] mb-3">{eyebrow}</p>}
          {title && <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{title}</h1>}
          {description && <p className="text-[#F3DEDA] max-w-xl text-sm sm:text-base leading-relaxed">{description}</p>}
        </div>
        <HeroWave fill="#FFFDF9" />
      </section>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-8">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading sponsors...
          </div>
        ) : sections && sections.length > 0 ? (
          <div className="space-y-16 py-8">
            {sections.map((sec, idx) => (
              <section
                key={sec.heading + idx}
                className={idx % 2 === 1 ? 'py-12 px-6 sm:px-8 lg:px-10 bg-[#FDF3EF] rounded-3xl' : 'py-8'}
              >
                <div className="text-center mb-8">
                  {sec.heading && <h2 className="text-2xl sm:text-3xl font-bold text-[#102B46] mb-2">{sec.heading}</h2>}
                  {sec.description && (
                    <p className="text-sm text-[#68717D] max-w-xl mx-auto">{sec.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-center">
                  {sec.sponsors.map(sp => (
                    <LogoCard key={sp.name} {...sp} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#FAF4EB] border border-[#F3DEDA] rounded-2xl p-8 max-w-xl mx-auto my-8">
            <h3 className="text-base font-bold text-[#102B46] mb-1">No Sponsors Listed</h3>
            {emptyMessage && <p className="text-xs text-slate-500">{emptyMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
