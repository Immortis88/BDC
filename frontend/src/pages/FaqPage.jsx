import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, Users, Mail, ArrowRight, Plus } from 'lucide-react';
import { api } from '../services/api.js';
import FaqSectionImage, { FAQ_IMAGE_SLOTS } from '../components/ui/FaqSectionImage.jsx';
import { getFaqsByCategory } from '../data/faqData.js';

export default function FaqPage() {
  const location = useLocation();
  const [images, setImages] = useState({});
  const [generalFaqs, setGeneralFaqs] = useState(() => getFaqsByCategory('general'));
  const [donationFaqs, setDonationFaqs] = useState(() => getFaqsByCategory('donation'));
  
  // Track open accordion indices per section
  const [openGeneralIndex, setOpenGeneralIndex] = useState(null);
  const [openDonationIndex, setOpenDonationIndex] = useState(null);

  // Set page title and handle hash smooth scrolling
  useEffect(() => {
    document.title = 'Frequently Asked Questions (FAQ) | SKIT Blood Donation Campaign';

    if (location.hash) {
      const targetElement = document.querySelector(location.hash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  // Fetch from shared API layer if dynamic updates occur
  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.faqs.getAll({ category: 'general' }),
      api.faqs.getAll({ category: 'donation' }),
      api.faqs.getImages()
    ]).then(([genRes, donRes, imageRes]) => {
      if (mounted) {
        if (imageRes?.success) setImages(imageRes.data);
        if (genRes?.success && genRes.data) setGeneralFaqs(genRes.data);
        if (donRes?.success && donRes.data) setDonationFaqs(donRes.data);
      }
    }).catch(() => {
      // Fallback already preloaded
    });

    return () => {
      mounted = false;
    };
  }, []);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${sectionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#374151]">
      
      {/* ===== Hero Section ===== */}
      <section className="relative w-full bg-[#FAF4EB] overflow-hidden">
        {/* Mobile / Small Screens (<md): Text header placed above artwork with comfortable spacing */}
        <div className="md:hidden pt-8 sm:pt-10 pb-4 px-4 sm:px-6 text-center max-w-xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#981B24] mb-3">
            FAQ
          </p>
          <h1
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ lineHeight: 1.15 }}
          >
            <span className="block text-[#102B46] [line-height:inherit]">Frequently</span>
            <span className="block text-[#981B24] [line-height:inherit]">Asked Questions</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed mt-5 max-w-md mx-auto">
            Find answers to the most common questions about the Blood Donation Campaign (BDC) at SKIT Jaipur.
          </p>
        </div>

        {/* Hero Artwork Container: Responsive full-width on mobile, proportional ~3:1 aspect ratio on desktop */}
        <div className="relative w-full md:aspect-[3/1] overflow-hidden">
          <img
            src="/assets/faq/faq-hero-bg.png"
            alt="SKIT Campus and Blood Donation Campaign artwork"
            className="w-full h-auto md:h-full md:object-cover md:object-bottom select-none pointer-events-none block"
          />

          {/* Desktop & Tablet Overlay (md+): Vertically centered on tablet, bottom-aligned on desktop, aligned with navbar logo */}
          <div className="hidden md:flex absolute inset-x-0 top-0 bottom-[22%] items-center lg:bottom-[42%] lg:items-end pointer-events-none">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pointer-events-auto">
              <div className="max-w-[340px] lg:max-w-[560px] xl:max-w-[620px] text-left">
                <p className="text-xs sm:text-[13px] font-bold tracking-[0.25em] uppercase text-[#981B24] mb-3">
                  FAQ
                </p>
                <h1
                  className="font-serif text-2xl md:text-[30px] lg:text-[52px] xl:text-[60px] font-bold tracking-tight"
                  style={{ lineHeight: 1.15 }}
                >
                  <span className="block text-[#102B46] [line-height:inherit]">Frequently</span>
                  <span className="block text-[#981B24] [line-height:inherit]">Asked Questions</span>
                </h1>
                <p className="text-xs md:text-[13px] lg:text-base text-[#4A5568] leading-relaxed mt-5 max-w-[340px] lg:max-w-[520px]">
                  Find answers to the most common questions about the Blood Donation Campaign (BDC) at SKIT Jaipur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Three Quick-Link Navigation Cards ===== */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 lg:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: General Questions */}
          <a
            href="#general-questions"
            onClick={(e) => scrollToSection(e, 'general-questions')}
            className="group bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl border border-[#F3DEDA] p-6 sm:p-7 shadow-[0_4px_20px_rgba(152,27,36,0.04)] hover:shadow-md hover:border-[#981B24]/40 transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#FCEBE6] text-[#981B24] flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Droplet className="w-5 h-5 fill-[#981B24]/10 stroke-[2]" />
            </div>
            <h2 className="font-serif font-bold text-lg text-[#102B46] group-hover:text-[#981B24] transition-colors">
              General Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#68717D] mt-1 mb-3">
              Basic information about BDC
            </p>
            <span className="inline-flex items-center text-[#981B24] group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>

          {/* Card 2: Donation Process */}
          <a
            href="#donation-process"
            onClick={(e) => scrollToSection(e, 'donation-process')}
            className="group bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl border border-[#F3DEDA] p-6 sm:p-7 shadow-[0_4px_20px_rgba(152,27,36,0.04)] hover:shadow-md hover:border-[#981B24]/40 transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#FCEBE6] text-[#981B24] flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="font-serif font-bold text-lg text-[#102B46] group-hover:text-[#981B24] transition-colors">
              Donation Process
            </h2>
            <p className="text-xs sm:text-sm text-[#68717D] mt-1 mb-3">
              Eligibility, safety and procedure
            </p>
            <span className="inline-flex items-center text-[#981B24] group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>

          {/* Card 3: Get in Touch */}
          <Link
            to="/contact"
            className="group bg-white/95 backdrop-blur-xs rounded-2xl sm:rounded-3xl border border-[#F3DEDA] p-6 sm:p-7 shadow-[0_4px_20px_rgba(152,27,36,0.04)] hover:shadow-md hover:border-[#981B24]/40 transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#FCEBE6] text-[#981B24] flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 stroke-[2]" />
            </div>
            <h2 className="font-serif font-bold text-lg text-[#102B46] group-hover:text-[#981B24] transition-colors">
              Get in Touch
            </h2>
            <p className="text-xs sm:text-sm text-[#68717D] mt-1 mb-3">
              Still have a question? Reach out to our team.
            </p>
            <span className="inline-flex items-center text-[#981B24] group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

        </div>
      </section>

      {/* ===== Main FAQ Content Area ===== */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-16 sm:py-20 lg:py-24 space-y-20 sm:space-y-24 lg:space-y-28">
        
        {/* ── Section 1: General Questions ── */}
        <section id="general-questions" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
            
            {/* Left: General Accordion List */}
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#981B24] mb-1.5">
                GENERAL QUESTIONS
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#102B46] tracking-tight mb-6 sm:mb-8">
                Frequently Asked Questions
              </h2>

              <div className="bg-white rounded-3xl border border-[#F3DEDA] shadow-[0_4px_24px_rgba(152,27,36,0.03)] p-6 sm:p-8 divide-y divide-[#F3DEDA]/80">
                {generalFaqs.map((faq, index) => {
                  const isOpen = openGeneralIndex === index;
                  const buttonId = `gen-btn-${faq.id || index}`;
                  const panelId = `gen-panel-${faq.id || index}`;

                  return (
                    <div key={faq.id || index} className="first:pt-0 last:pb-0">
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenGeneralIndex(prev => (prev === index ? null : index))}
                        className="w-full flex items-center justify-between text-left py-4 sm:py-4.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#981B24]/40 rounded-lg transition-colors"
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

            {/* FAQ section photograph */}
            <div className="w-full sticky top-28">
              <FaqSectionImage {...FAQ_IMAGE_SLOTS[0]} image={images.general} />
            </div>

          </div>
        </section>

        {/* ── Section 2: Donation Process (Mirrored Layout) ── */}
        <section id="donation-process" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
            
            {/* FAQ section photograph */}
            <div className="w-full order-2 lg:order-1 sticky top-28">
              <FaqSectionImage {...FAQ_IMAGE_SLOTS[1]} image={images.donation} />
            </div>

            {/* Right: Donation Accordion List */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#981B24] mb-1.5">
                DONATION PROCESS
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#102B46] tracking-tight mb-6 sm:mb-8">
                Donation Related Questions
              </h2>

              <div className="bg-white rounded-3xl border border-[#F3DEDA] shadow-[0_4px_24px_rgba(152,27,36,0.03)] p-6 sm:p-8 divide-y divide-[#F3DEDA]/80">
                {donationFaqs.map((faq, index) => {
                  const isOpen = openDonationIndex === index;
                  const buttonId = `don-btn-${faq.id || index}`;
                  const panelId = `don-panel-${faq.id || index}`;

                  return (
                    <div key={faq.id || index} className="first:pt-0 last:pb-0">
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenDonationIndex(prev => (prev === index ? null : index))}
                        className="w-full flex items-center justify-between text-left py-4 sm:py-4.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#981B24]/40 rounded-lg transition-colors"
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

          </div>
        </section>

      </div>

    </div>
  );
}
