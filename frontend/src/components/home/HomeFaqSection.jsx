import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { api } from '../../services/api.js';
import { getHomeFaqs } from '../../data/faqData.js';

export default function HomeFaqSection({ content = {} }) {
  const [faqs, setFaqs] = useState(() => getHomeFaqs(5));
  const [openIndex, setOpenIndex] = useState(null);
  const eyebrow = content.eyebrow ?? 'FAQ';
  const headingLine1 = content.headingLine1 ?? 'Frequently';
  const headingLine2 = content.headingLine2 ?? 'Asked Questions';
  const description = content.description ?? 'Find quick answers to the most common questions about the Blood Donation Campaign (BDC) at SKIT Jaipur.';
  const hasHeading = Boolean(headingLine1 || headingLine2);

  useEffect(() => {
    let mounted = true;
    api.faqs.getAll({ home: true })
      .then((res) => {
        if (mounted && res?.success && res.data) {
          setFaqs(res.data);
        }
      })
      .catch(() => {
        // Fallback already populated via initial state
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleAccordion = (index) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <section
      aria-labelledby="homepage-faq-heading"
      className="relative z-10 w-full overflow-hidden bg-[#FCF7EE] pt-14 sm:pt-18 lg:pt-22 pb-24 sm:pb-28 lg:pb-36"
    >
      {/* Background Wave Asset Layer (Anchored to bottom, leading into the red CTA band) */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full h-[180px] sm:h-[240px] lg:h-[300px] pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/faq/faq-wave-bg.png"
          alt=""
          role="presentation"
          className="w-full h-full object-cover object-bottom"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          {eyebrow && <p className="text-xs sm:text-[13px] font-bold tracking-[0.25em] uppercase text-[#981B24] mb-2 sm:mb-2.5">{eyebrow}</p>}
          {hasHeading && <h2 id="homepage-faq-heading" className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12]">
            {headingLine1 && <span className="block text-[#102B46]">{headingLine1}</span>}
            {headingLine2 && <span className="block text-[#981B24] mt-0.5 sm:mt-1">{headingLine2}</span>}
          </h2>}
          {description && <p className="text-sm sm:text-[15px] lg:text-base text-[#4A5568] leading-relaxed mt-4 max-w-xl mx-auto">{description}</p>}
        </div>

        {/* Two-Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Left Card: Accordion List (5 items) */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-[#F3DEDA] shadow-[0_4px_24px_rgba(152,27,36,0.04)] p-6 sm:p-8 flex flex-col justify-center">
            <div className="divide-y divide-[#F3DEDA]/80">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                const buttonId = `faq-btn-${faq.id || index}`;
                const panelId = `faq-panel-${faq.id || index}`;

                return (
                  <div key={faq.id || index} className="first:pt-0 last:pb-0">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between text-left py-4 sm:py-5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#981B24]/40 rounded-lg transition-colors"
                    >
                      <span className="text-sm sm:text-[15px] font-semibold text-[#102B46] group-hover:text-[#981B24] transition-colors pr-4">
                        {faq.question}
                      </span>
                      <span
                        className={`w-6 h-6 flex items-center justify-center shrink-0 text-[#981B24] transition-transform duration-200 ${
                          isOpen ? 'rotate-45' : 'rotate-0'
                        }`}
                        aria-hidden="true"
                      >
                        <Plus className="w-5 h-5 stroke-[2]" />
                      </span>
                    </button>

                    {/* Smooth Animated Height Collapse/Expand */}
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0 pb-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed pr-6">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Card: "Have more questions?" */}
          <div className="bg-[#FAF0EB] rounded-3xl border border-[#F3DEDA] shadow-[0_4px_24px_rgba(152,27,36,0.04)] p-8 sm:p-10 flex flex-col items-center justify-center text-center">
            {/* Chat Icon in soft circle */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#F5DFD7] text-[#981B24] flex items-center justify-center mb-5 shadow-2xs">
              <svg
                viewBox="0 0 32 32"
                className="w-8 h-8 text-[#981B24]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Back speech bubble */}
                <path d="M17 6h7a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1.5l-3 2.5v-2.5" />
                {/* Front speech bubble */}
                <path d="M5 11h13a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-2l-4 3.5v-3.5H5a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z" />
                {/* Three dots in front bubble */}
                <circle cx="7.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
                <circle cx="11.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
                <circle cx="15.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#102B46] leading-snug tracking-tight mb-2">
              Have more<br />questions?
            </h3>

            <p className="text-xs sm:text-sm text-[#68717D] leading-relaxed max-w-[220px] mb-6">
              Visit our detailed FAQ page for more information.
            </p>

            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#981B24] hover:bg-[#7E141C] text-white shadow-xs hover:shadow-sm transition-all duration-150 group"
            >
              <FileText className="w-4 h-4 transition-transform group-hover:scale-105" aria-hidden="true" />
              <span>View All FAQs</span>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
