import React from 'react';

export default function LeadershipSection({ data }) {
  const cards = (data?.cards || []).filter(card => card.name?.trim() || card.role?.trim() || card.description?.trim());
  if (data?.enabled === false || !cards.length) return null;
  const cardWidth = maxColumns => {
    const columns = Math.min(cards.length, maxColumns);
    return `calc((100% - ${(columns - 1) * 1.5}rem) / ${columns})`;
  };
  return <section aria-label="Our leadership" className="py-12 sm:py-16 max-w-[1400px] mx-auto px-4 sm:px-8">
    <div className="text-center mb-8 sm:mb-10">
      {(data?.eyebrow ?? 'Our Strength') && <p className="text-xs font-bold tracking-widest uppercase text-[#B30E1F] mb-2">{data?.eyebrow ?? 'Our Strength'}</p>}
      {(data?.heading ?? 'The Leadership Behind Our Success') && <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#031B44]">{data?.heading ?? 'The Leadership Behind Our Success'}</h2>}
    </div>
    <div className="flex flex-wrap justify-center gap-6" style={{
      '--card-width-sm': cardWidth(2),
      '--card-width-lg': cardWidth(3),
      '--card-width-xl': cardWidth(6),
    }}>
      {cards.map((card, index) => <article key={card.id || index} className="w-full sm:w-[var(--card-width-sm)] lg:w-[var(--card-width-lg)] xl:w-[var(--card-width-xl)] max-w-sm overflow-hidden rounded-2xl border border-[#EAD7CF] bg-[#FFFDF9] shadow-sm">
        {card.imageUrl && <div className="relative aspect-square bg-[#F0E6DA]">
          <img key={card.imageUrl} src={card.imageUrl} alt={card.name || 'Leadership portrait'} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-top" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
        </div>}
        <div className="p-5 text-center break-words">
          {card.name && <h3 className="font-serif text-xl font-bold text-[#031B44]">{card.name}</h3>}
          {card.role && <p className="text-sm font-semibold text-[#B30E1F] mt-1">{card.role}</p>}
          {card.description && <p className="text-sm text-[#4A5568] leading-relaxed mt-3 whitespace-pre-line">{card.description}</p>}
        </div>
      </article>)}
    </div>
  </section>;
}
