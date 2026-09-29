import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export const FAQ_IMAGE_SLOTS = [
  { key: 'general', title: 'Camp Day Moments', description: 'Donor with "Donate Blood Save Lives" banner' },
  { key: 'donation', title: 'Safe & Comfortable Experience', description: 'Smiling voluntary donor in the donation lounge' }
];

export default function FaqSectionImage({ image, title, description }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image?.url]);

  return (
    <div className="w-full aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] rounded-3xl border border-[#F3DEDA] bg-[#FAF0EB] shadow-[0_4px_20px_rgba(152,27,36,0.03)] overflow-hidden flex flex-col items-center justify-center text-center relative group">
      {image?.url && !failed ? (
        <img src={image.url} alt={image.alt || title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <>
          <div className="w-36 h-36 rounded-full bg-[#F5DFD7]/60 absolute pointer-events-none select-none transition-transform group-hover:scale-105" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xs text-[#981B24] flex items-center justify-center shadow-xs mb-3.5">
              <ImageIcon className="w-6 h-6 stroke-[1.8]" aria-hidden="true" />
            </div>
            <p className="font-serif font-bold text-sm sm:text-base text-[#102B46] mb-1">{title}</p>
            <p className="text-xs text-[#68717D] max-w-[220px] leading-relaxed">{description}</p>
          </div>
        </>
      )}
    </div>
  );
}
