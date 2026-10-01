import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useFeaturedCamp } from '../../hooks/useFeaturedCamp.js';

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Events', path: '/events' },
  { name: 'Team', path: '/team' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contact', path: '/contact' }
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);

  // Initialize from current scroll position
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 8;
    }
    return false;
  });

  const { data: featuredCamp, isLoading, isError } = useFeaturedCamp();

  // Passive scroll listener with cleanup and current scroll check
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 8;
      setIsScrolled(scrolled);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change & re-verify scroll position
  useEffect(() => {
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      setIsScrolled(window.scrollY > 8);
    }
  }, [location.pathname]);

  // Click outside listener for mobile menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const isRegistrationOpen = !isError && !isLoading && featuredCamp?.is_registration_available === true;
  const registerHref = `/register${featuredCamp?._id ? `?camp_id=${featuredCamp._id}` : ''}`;
  const registerLabel = (isError || isLoading) ? 'Register' : isRegistrationOpen ? 'Register' : 'Registration Closed';

  return (
    <>
      {/* Reserved Layout Space to prevent page jumps or flickering when navbar floats */}
      <div className="h-[68px] sm:h-[72px] w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Floating / Sticky Navbar */}
      <header
        ref={headerRef}
          className={`fixed z-40 inset-x-0 mx-auto transition-all duration-200 ease-out motion-reduce:transition-none ${
          isScrolled
            ? 'top-[8px] md:top-[14px] w-[calc(100%-24px)] md:w-[90%] max-w-[1600px] navbar-scrolled rounded-[33px] overflow-hidden'
            : 'top-0 w-full max-w-full rounded-none navbar-top'
        }`}
      >
        <div
          className={`w-full mx-auto transition-all duration-200 ease-out motion-reduce:transition-none ${
            isScrolled
              ? 'px-4 sm:px-6 md:px-7 lg:px-8'
              : 'max-w-[1600px] px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%]'
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-200 ease-out motion-reduce:transition-none ${
              isScrolled ? 'h-[62px] sm:h-[66px]' : 'h-[68px] sm:h-[72px]'
            }`}
          >
            {/* Institutional & Campaign Branding (Left) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 py-1">
              <a
                href="https://www.skit.ac.in/"
                className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F]/40 rounded-lg transition-opacity hover:opacity-95"
                aria-label="SKIT official website"
              >
                <img
                  src="/assets/Skit_logo.png"
                  alt="SKIT Logo"
                  className={`w-auto object-contain shrink-0 transition-all duration-200 ease-out motion-reduce:transition-none ${
                    isScrolled ? 'h-9 sm:h-10' : 'h-11 sm:h-12'
                  }`}
                />
              </a>
              <div
                className={`w-[1px] bg-[#E2E8F0] shrink-0 transition-all duration-200 ease-out motion-reduce:transition-none ${
                  isScrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-9'
                }`}
                aria-hidden="true"
              />
              <Link
                to="/"
                className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F]/40 rounded-lg transition-opacity hover:opacity-95"
                aria-label="Blood Donation Campaign Home"
              >
                <img
                  src="/assets/bdc_nav_logo.svg"
                  alt="BDC Logo"
                  className={`w-auto object-contain shrink-0 transition-all duration-200 ease-out motion-reduce:transition-none ${
                    isScrolled ? 'h-8 sm:h-9' : 'h-10 sm:h-11'
                  }`}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-6 xl:gap-8 px-4 lg:px-6"
              aria-label="Main Navigation"
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `relative inline-flex flex-col items-center py-2 text-sm md:text-[14px] lg:text-[15px] tracking-normal transition-colors duration-150 whitespace-nowrap ${
                      isActive
                        ? 'text-[#B30E1F] font-semibold'
                        : 'text-[#374151] hover:text-[#B30E1F] font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.name}</span>
                      {isActive && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B30E1F] rounded-full"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Register Button (Right) */}
            <div className="hidden md:flex items-center shrink-0">
              {isRegistrationOpen ? (
                <Link
                  to={registerHref}
                  className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 ${
                    isScrolled ? 'rounded-full' : 'rounded-lg'
                  } text-sm font-semibold text-white bg-[#B30E1F] hover:bg-[#990A18] active:scale-[0.99] shadow-xs hover:shadow-sm transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B30E1F]`}
                >
                  <span>Register</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 ${
                    isScrolled ? 'rounded-full' : 'rounded-lg'
                  } text-sm font-semibold text-white bg-[#B30E1F] opacity-80 shadow-xs cursor-not-allowed`}
                >
                  <span>{registerLabel}</span>
                  {(isError || isLoading) && (
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#031B44] hover:bg-[#EAD7CF]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30E1F]/50 cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

                {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
            mobileMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen ? '' : undefined}
        >
          <div className="overflow-hidden min-h-0">
            <div
              id="mobile-navigation"
              className={`px-4 pt-3 pb-5 border-t max-h-[calc(100vh-90px)] overflow-y-auto ${
                isScrolled ? 'border-[rgba(152,27,36,0.12)]' : 'border-[#EAD7CF] bg-[#FAF4EB]'
              }`}
              aria-label="Mobile Navigation"
            >
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                        isActive
                          ? 'text-[#B30E1F] bg-[#EAD7CF]/40 font-semibold'
                          : 'text-[#374151] hover:text-[#B30E1F] hover:bg-[#EAD7CF]/20 font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{link.name}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B30E1F]" aria-hidden="true" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAD7CF]/60">
                {isRegistrationOpen ? (
                  <Link
                    to={registerHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-[#B30E1F] hover:bg-[#990A18] shadow-xs transition-all duration-150"
                  >
                    <span>Register</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-[#B30E1F] opacity-80 shadow-xs cursor-not-allowed"
                  >
                    <span>{registerLabel}</span>
                    {(isError || isLoading) && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
