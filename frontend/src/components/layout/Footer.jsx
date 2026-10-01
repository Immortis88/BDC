import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import { api } from '../../services/api.js';
import { getSocialLinks } from '../../utils/socialLinks.js';

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
    </svg>
  );
}

const SOCIAL_ICONS = { facebook: Facebook, instagram: Instagram, x: XIcon, youtube: Youtube };

export default function Footer({ tagline, verifiedPhone = null, socialLinks }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.settings.getPublic()
      .then(res => {
        if (mounted && res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const effectiveTagline = tagline || 'A student initiative for a healthier, stronger tomorrow.';
  const verifiedSocials = getSocialLinks(socialLinks ?? settings?.social_links);

  return (
    <footer className="bg-[#0B233D] text-[#FFF9F2] mt-auto border-t border-[#061525]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.3fr_1fr] gap-x-5 gap-y-8 sm:gap-8 lg:gap-10 mb-8 sm:mb-10">
          
          {/* Column 1: Branding */}
          <div className="col-span-2 sm:col-span-1 lg:border-r lg:border-slate-700/60 lg:pr-8">
            <div className="inline-flex items-center gap-2.5 sm:gap-3 bg-[#D9DEDC] p-2.5 sm:p-3 rounded-[8px] shadow-xs shrink-0">
              <img
                src="/assets/Skit_logo.png"
                alt="SKIT Jaipur"
                className="h-8 sm:h-9 w-auto object-contain shrink-0"
              />
              <div className="w-[1px] h-6 sm:h-7 bg-[#B8BEBC] shrink-0" aria-hidden="true" />
              <img
                src="/assets/bdc_nav_logo.svg"
                alt="BDC Logo"
                className="h-7 sm:h-8 w-auto object-contain shrink-0"
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-3 max-w-[280px]">
              {effectiveTagline}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="min-w-0">
            <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  About BDC
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  Moments That Matter
                </Link>
              </li>
              <li>
                <Link
                  to="/team"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  Our Team
                </Link>
              </li>
              <li>
                <Link
                  to="/supporters"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  Sponsors & Partners
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded inline-block"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Location */}
          <div className="min-w-0 lg:border-r lg:border-slate-700/60 lg:pr-8">
            <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide">
              Contact Us
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed break-words">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blood-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {settings?.campus_address || 'Swami Keshvanand Institute of Technology, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blood-400 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${settings?.contact_email || 'bdc@skit.ac.in'}`}
                  className="hover:text-white transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                >
                  {settings?.contact_email || 'bdc@skit.ac.in'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blood-400 shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${settings?.contact_phone || '+911413500300'}`}
                  className="hover:text-white transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                >
                  {settings?.contact_phone || '+91 141 3500300'}
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Follow Us & Legal */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4 tracking-wide">
              Connect With Us
            </h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Follow our community initiatives, upcoming drives, and donor stories.
            </p>
            {verifiedSocials.length > 0 && (
              <div className="flex items-center gap-3">
                {verifiedSocials.map((item, idx) => {
                  const Icon = SOCIAL_ICONS[item.platform];
                  return (
                    <a
                      key={idx}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-blood-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                      aria-label={item.label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Swami Keshvanand Institute of Technology (SKIT Jaipur). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
