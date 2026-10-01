import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Globe,
  Bell,
  HelpCircle,
  Phone,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ExternalLink,
  X,
  Edit2,
  Sparkles,
  Info,
  Monitor,
  Smartphone,
  BookOpen,
  FileText,
  ClipboardList,
  Lock,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import Swal from 'sweetalert2';
import LoadingState from '../components/LoadingState.jsx';
import HomePage from '../../pages/HomePage.jsx';
import AboutPage from '../../pages/AboutPage.jsx';
import FaqSectionImage, { FAQ_IMAGE_SLOTS } from '../../components/ui/FaqSectionImage.jsx';
import DonationProcess from '../../components/faq/DonationProcess.jsx';
import DonationProcessTextEditor from '../components/DonationProcessTextEditor.jsx';
import { HeroPhotosEditor, LeadershipEditor } from '../components/HomepagePhotoEditors.jsx';
import ImagePickerModal, { ImagePickerField } from '../components/ImagePickerModal.jsx';
import GalleryAdminManager from '../components/GalleryAdminManager.jsx';
import { normalizeSocialSettings } from '../../utils/socialLinks.js';

/**
 * Isolated Preview Frame
 * Renders the preview inside an actual iframe with cloned parent styles and scripts.
 * In mobile mode (width: 390px), media queries inside the iframe evaluate against the
 * true 390px viewport width, rendering genuine mobile layouts instead of squeezed desktop layouts.
 */
function PreviewIframe({ children, device = 'desktop', className = '' }) {
  const [mountNode, setMountNode] = useState(null);
  const iframeRef = useRef(null);

  const syncStyles = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;

    if (!doc.head || !doc.body) return;

    if (!doc.head.querySelector('meta[name="viewport"]')) {
      const meta = doc.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0';
      doc.head.appendChild(meta);

      // Copy fonts & stylesheet links from parent document
      document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"]').forEach(link => {
        doc.head.appendChild(link.cloneNode(true));
      });

      // Copy all style tags (Vite injected Tailwind CSS)
      document.querySelectorAll('style').forEach(style => {
        doc.head.appendChild(style.cloneNode(true));
      });
    }

    doc.body.className = 'bg-[#FAF4EB] m-0 p-0 font-sans antialiased text-slate-800';
    setMountNode(doc.body);
  }, []);

  useEffect(() => {
    syncStyles();
  }, [syncStyles]);

  return (
    <div className={`w-full flex justify-center items-center py-2 ${className}`}>
      <div
        className={`transition-all duration-300 relative ${
          device === 'mobile'
            ? 'w-[410px] h-[780px] bg-slate-900 p-2.5 rounded-[44px] shadow-2xl border-4 border-slate-800 ring-1 ring-slate-900/40 my-2'
            : 'w-full max-w-6xl h-[84vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'
        }`}
      >
        {device === 'mobile' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 pointer-events-none" />
        )}
        <iframe
          ref={(node) => {
            iframeRef.current = node;
            if (node) {
              node.onload = syncStyles;
              syncStyles();
            }
          }}
          title="Responsive Preview Frame"
          className="w-full h-full bg-[#FAF4EB] rounded-2xl border-0 overflow-y-auto"
        />
        {mountNode && createPortal(
          <div
            onClickCapture={(e) => {
              const anchor = e.target.closest('a');
              if (anchor) {
                e.preventDefault();
              }
            }}
          >
            {children}
          </div>,
          mountNode
        )}
      </div>
    </div>
  );
}

/**
 * Normalizes homepage editor state into MySQL CMS JSON payload with dual-compatibility
 * for both new and legacy field keys across editor, API, and public pages.
 */
function normalizeHomepagePayload(form) {
  return {
    ...form,
    hero: {
      ...form.hero,
      subheadline: form.hero.description,
      description: form.hero.description,
      primaryCtaLabel: form.hero.primaryCtaLabel,
      ctaLabel: form.hero.primaryCtaLabel,
      secondaryCtaLabel: form.hero.secondaryCtaLabel,
      secondaryCtaUrl: form.hero.secondaryCtaUrl || '/about',
      ctaUrl: form.hero.secondaryCtaUrl || '/about',
      slides: (form.hero.slides || []).map(s => ({
        ...s,
        imageUrl: s.imageUrl ?? s.image_url,
        image_url: s.imageUrl ?? s.image_url,
        focalPosition: s.focalPosition || 'right 20%'
      }))
    },
    about: {
      ...form.about,
      heading: form.about.headline,
      headline: form.about.headline,
      body1: form.about.description,
      description: form.about.description
    },
    inspiration: {
      ...form.inspiration,
      eyebrow: form.inspiration.sectionLabel,
      sectionLabel: form.inspiration.sectionLabel,
      heading: form.inspiration.name,
      name: form.inspiration.name,
      quote: form.inspiration.closingStatement,
      closingStatement: form.inspiration.closingStatement
    },
    ctaBand: {
      ...form.ctaBand,
      heading: [form.ctaBand.headline1, form.ctaBand.headline2].filter(Boolean).join(' '),
      headline1: form.ctaBand.headline1,
      headline2: form.ctaBand.headline2,
      buttonLabel: form.ctaBand.buttonLabel,
      ctaLabel: form.ctaBand.buttonLabel
    }
  };
}

/**
 * Maps incoming MySQL CMS draft payload into editor state with dual-compatibility fallbacks
 */
function toSafeNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapHomepageDraft(payload, prev) {
  if (!payload) return prev;
  return {
    ...prev,
    ...payload,
    hero: {
      ...prev.hero,
      ...(payload.hero || {}),
      description: payload.hero?.description || payload.hero?.subheadline || prev.hero.description,
      primaryCtaLabel: payload.hero?.primaryCtaLabel || payload.hero?.ctaLabel || prev.hero.primaryCtaLabel,
      secondaryCtaLabel: payload.hero?.secondaryCtaLabel || prev.hero.secondaryCtaLabel,
      secondaryCtaUrl: payload.hero?.secondaryCtaUrl || payload.hero?.ctaUrl || prev.hero.secondaryCtaUrl,
      slides: (payload.hero?.slides || prev.hero.slides || []).map(s => ({
        ...s,
        image_url: s.imageUrl ?? s.image_url,
        imageUrl: s.imageUrl ?? s.image_url,
        focalPosition: s.focalPosition || 'right 20%'
      }))
    },
    about: {
      ...prev.about,
      ...(payload.about || {}),
      headline: payload.about?.headline || payload.about?.heading || prev.about.headline,
      description: payload.about?.description || payload.about?.body1 || prev.about.description
    },
    impact: {
      ...prev.impact,
      ...(payload.impact || {}),
      bloodUnits: toSafeNumber(payload.impact?.bloodUnits, prev.impact?.bloodUnits ?? 0),
      donorsCount: toSafeNumber(payload.impact?.donorsCount, prev.impact?.donorsCount ?? 0),
      campsCount: toSafeNumber(payload.impact?.campsCount, prev.impact?.campsCount ?? 0),
      bannerUrl: payload.impact?.bannerUrl ?? payload.impact?.backgroundUrl ?? prev.impact?.bannerUrl ?? ''
    },
    inspiration: {
      ...prev.inspiration,
      ...(payload.inspiration || {}),
      sectionLabel: payload.inspiration?.sectionLabel || payload.inspiration?.eyebrow || prev.inspiration.sectionLabel,
      name: payload.inspiration?.name || payload.inspiration?.heading || prev.inspiration.name,
      closingStatement: payload.inspiration?.closingStatement || payload.inspiration?.quote || prev.inspiration.closingStatement
    },
    ctaBand: {
      ...prev.ctaBand,
      ...(payload.ctaBand || {}),
      headline1: payload.ctaBand?.headline1 || payload.ctaBand?.heading || prev.ctaBand.headline1,
      headline2: payload.ctaBand?.headline2 || '',
      buttonLabel: payload.ctaBand?.buttonLabel || payload.ctaBand?.ctaLabel || prev.ctaBand.buttonLabel
    }
  };
}

export default function WebsiteAdminPage() {
  const { isSuperAdmin, hasPermission } = useAdminAuth();
  const { selectedCamp, selectedCampId, isLiveCamp, camps } = useAdminCamp();
  const campYear = selectedCamp?.camp_year || selectedCampId || 2026;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') || '').toUpperCase();
  const validTabs = ['HOMEPAGE', 'ABOUT', 'GALLERY', 'PAGES', 'REGISTRATION_TEXT', 'NOTICES', 'FAQ', 'CONTACT'];
  const initialTab = validTabs.includes(tabParam) ? tabParam : 'HOMEPAGE';

  // Tabs: 'HOMEPAGE' | 'ABOUT' | 'GALLERY' | 'PAGES' | 'REGISTRATION_TEXT' | 'NOTICES' | 'FAQ' | 'CONTACT'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const qTab = (searchParams.get('tab') || '').toUpperCase();
    if (qTab && validTabs.includes(qTab) && qTab !== activeTab) {
      setActiveTab(qTab);
    }
  }, [searchParams, activeTab]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [loadErrors, setLoadErrors] = useState({});
  const [initialStates, setInitialStates] = useState({});

  // 1. Homepage Draft Form
  const [homepageForm, setHomepageForm] = useState({
    hero: {
      eyebrow: 'SKIT JAIPUR · BLOOD DONATION CAMPAIGN',
      headline: 'Donate blood.\nCarry hope.',
      description: 'A small act from you can give someone a second chance at life.',
      primaryCtaLabel: 'Register Now',
      secondaryCtaLabel: 'Our Journey',
      secondaryCtaUrl: '/about',
      slides: [
        {
          id: 1,
          image_url: '/assets/A01-home-hero-donor-v2.webp',
          alt: 'Student donating blood at SKIT Blood Donation Camp',
          focalPosition: 'right 20%',
          order: 1
        }
      ]
    },
    about: {
      eyebrow: 'ABOUT BDC',
      headline: 'A student initiative for a healthier tomorrow.',
      description: 'The Blood Donation Campaign (BDC) at SKIT is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community.',
      ctaLabel: 'Discover BDC',
      ctaUrl: '/about',
      imageUrl: '/assets/A01-home-hero-donor-v2.webp'
    },
    impact: {
      bloodUnits: 1200,
      donorsCount: 2500,
      campsCount: 24,
      bannerUrl: '/assets/bdc_impact_slightly_bright_webp.webp'
    },
    inspiration: {
      sectionLabel: 'Our Inspiration',
      name: 'Swami Keshvanand',
      description: 'A legacy of education, selfless service and community upliftment.',
      closingStatement: 'Values for a Better Tomorrow.',
      slogansLeft: 'Education, Service, Society, Self Reliance',
      slogansRight: 'Individual, Development, Leads To, A Stronger, Nation',
      portraitUrl: '/assets/inspiration_swamiji.png'
    },
    ctaBand: {
      eyebrow: 'BE A LIFESAVER',
      headline1: 'Your one small act.',
      headline2: 'Someone’s tomorrow.',
      buttonLabel: 'Register Now'
    }
  });

  // 2. About Page Form
  const [aboutForm, setAboutForm] = useState({
    hero: {
      eyebrow: 'About BDC',
      headline: 'A student initiative for a healthier tomorrow.',
      description: 'The Blood Donation Campaign at SKIT is a student-led initiative dedicated to spreading awareness and contributing towards a healthier, stronger community through voluntary blood donation.',
      heroPhotoUrl: ''
    },
    photos: [
      { id: 'about-photo-1', url: '', alt: 'Doctor and donor during blood donation', label: 'Camp Donor & Medical Care' },
      { id: 'about-photo-2', url: '', alt: 'Student volunteers managing registrations', label: 'Student Volunteer Coordination' },
      { id: 'about-photo-3', url: '', alt: 'BDC volunteer supporting donor initiative', label: 'BDC Volunteer Initiative' }
    ],
    story: {
      eyebrow: 'OUR STORY',
      headline: 'Built by students, for the community.',
      paragraph1: 'The Blood Donation Campaign (BDC) at SKIT is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community. What started as a single campus drive has grown into a recurring program, bringing together student coordinators, volunteers, and donors from across the institute.',
      paragraph2: 'Every camp is organised entirely by students — from outreach and registration to on-ground logistics and partner coordination — under the guidance of faculty advisors and NSS SKIT Jaipur. Through collective effort and compassion, BDC continues to inspire more people to donate blood and make a difference in the lives of those in need.'
    },
    values: {
      mission: { title: 'Our Mission', description: 'To create sustained awareness about voluntary blood donation and ensure a reliable, safe blood supply for the community around SKIT.' },
      vision: { title: 'Our Vision', description: 'A culture where regular voluntary blood donation is second nature to every eligible citizen, ensuring no life is lost due to blood shortage.' },
      values: { title: 'Our Values', description: 'Compassion, transparency, student leadership, and an unwavering commitment to safe, ethical, and voluntary donor care.' }
    },
    cta: {
      headline: 'Ready to make a difference?',
      description: 'Join hundreds of donors and volunteers in saving lives at the next BDC camp.',
      buttonLabel: 'Register to Donate',
      buttonUrl: '/register'
    }
  });

  // 3. Pages Headers Form (Team, Gallery, Supporters)
  const [pagesForm, setPagesForm] = useState({
    team: {
      eyebrow: 'ORGANIZING TEAM',
      title: 'The People Behind the Movement',
      description: 'Meet the faculty coordinators, student leads, and dedicated volunteers making this blood donation camp possible.',
      emptyMessage: 'Team roster for this camp is being finalized. Please check back shortly.'
    },
    gallery: {
      eyebrow: 'CAMP MEMORIES',
      title: 'Moments of Compassion & Service',
      description: 'A visual journey through past and present blood donation camps organized at SKIT Jaipur.',
      emptyMessage: 'Gallery photos will be published once camp activities commence.'
    },
    supporters: {
      eyebrow: 'PARTNERS & SPONSORS',
      title: 'Our Supporting Organizations',
      description: 'We are profoundly grateful to the healthcare institutions, blood banks, and community partners supporting BDC.',
      emptyMessage: 'Partner and supporter details will be announced soon.'
    }
  });

  // 4. Registration Text Form
  const [regTextForm, setRegTextForm] = useState({
    title: 'Voluntary Blood Donor Registration',
    description: 'Register in advance to reserve your preferred donation slot and expedite your on-campus verification.',
    eligibilityNotice: 'Donors must be between 18-65 years old, weigh at least 45 kg, and be in good general health.',
    helpText: 'Having trouble registering? Reach out to the student coordinators or visit the helpdesk at Central Amphitheatre on camp day.'
  });

  // 5. Notices
  const [notices, setNotices] = useState([]);
  const [newNoticeText, setNewNoticeText] = useState('');
  const [newNoticeLink, setNewNoticeLink] = useState('');

  // 6. FAQs
  const [faqForm, setFaqForm] = useState({ items: [], images: {} });
  const faqs = faqForm.items;
  const setFaqs = (items) => setFaqForm(prev => ({ ...prev, items }));
  const [faqModalItem, setFaqModalItem] = useState(null); // { mode: 'create'|'edit', item }

  // 7. Contact & Footer
  const [contactForm, setContactForm] = useState({
    siteTitle: 'SKIT Blood Donation Campaign',
    phone: '+91 141 350 0000',
    email: 'bdc@skit.ac.in',
    address: 'Swami Keshvanand Institute of Technology, Management & Gramothan (SKIT), Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017',
    footerTagline: 'A student initiative for a healthier, stronger tomorrow.',
    socialLinks: [
      { id: 1, label: 'Facebook', url: 'https://facebook.com/skitjaipur', order: 1 },
      { id: 2, label: 'Instagram', url: 'https://instagram.com/skitjaipur', order: 2 },
      { id: 3, label: 'X (Twitter)', url: '', order: 3 },
      { id: 4, label: 'YouTube', url: 'https://youtube.com/skitjaipur', order: 4 }
    ]
  });

  // Tab definitions & permission bindings
  const TAB_DEFINITIONS = [
    { key: 'HOMEPAGE', label: 'Homepage Content', icon: Globe, perm: 'website.homepage' },
    { key: 'ABOUT', label: 'About Page', icon: BookOpen, perm: 'website.about' },
    { key: 'GALLERY', label: 'Photo Gallery Albums', icon: ImageIcon, perm: 'website.gallery' },
    { key: 'PAGES', label: 'Page Headers Copy', icon: FileText, perm: 'website.pages' },
    { key: 'REGISTRATION_TEXT', label: 'Registration Text', icon: ClipboardList, perm: 'website.registration_text' },
    { key: 'NOTICES', label: 'Notices & Announcements', icon: Bell, perm: 'website.notices', count: notices.length },
    { key: 'FAQ', label: 'FAQ Management', icon: HelpCircle, perm: 'website.faq', count: faqs.length },
    { key: 'CONTACT', label: 'Contact & Footer Settings', icon: Phone, perm: 'website.contact' }
  ];

  const availableTabs = TAB_DEFINITIONS.filter(t => isSuperAdmin || hasPermission(t.perm));

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);

  const handleUploadImage = async (file, onUploaded) => {
    if (!file) return;
    try {
      const area = activeTab.toLowerCase() === 'about' ? 'about' : 'homepage';
      const res = await adminService.upload(file, { kind: 'SITE', area });
      if (res.success && (res.url || res.path || res.relative_path)) {
        const finalUrl = res.url || `/media/${res.relative_path || res.path}`;
        onUploaded(finalUrl);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Image uploaded successfully.',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: res.message || 'Could not upload image.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.message || 'Unexpected error during upload.',
        confirmButtonColor: '#B91C1C'
      });
    }
  };

  // Helper to fetch/reload an individual area
  const reloadArea = async (area) => {
    setLoading(true);
    try {
      const res = await adminService.cms.getArea(area);
      if (res.success) {
        setLoadErrors(prev => {
          const cp = { ...prev };
          delete cp[area];
          return cp;
        });

        if (res.payload) {
          if (area === 'HOMEPAGE') {
            setHomepageForm(prev => {
              const mapped = mapHomepageDraft(res.payload, prev);
              setInitialStates(i => ({ ...i, HOMEPAGE: JSON.stringify(mapped) }));
              return mapped;
            });
          } else if (area === 'ABOUT') {
            setAboutForm(prev => {
              const mapped = { ...prev, ...res.payload };
              setInitialStates(i => ({ ...i, ABOUT: JSON.stringify(mapped) }));
              return mapped;
            });
          } else if (area === 'PAGES') {
            setPagesForm(prev => {
              const mapped = { ...prev, ...res.payload };
              setInitialStates(i => ({ ...i, PAGES: JSON.stringify(mapped) }));
              return mapped;
            });
          } else if (area === 'REGISTRATION_TEXT') {
            setRegTextForm(prev => {
              const mapped = { ...prev, ...res.payload };
              setInitialStates(i => ({ ...i, REGISTRATION_TEXT: JSON.stringify(mapped) }));
              return mapped;
            });
          } else if (area === 'NOTICES' && res.payload.items) {
            setNotices(res.payload.items);
            setInitialStates(i => ({ ...i, NOTICES: JSON.stringify(res.payload.items) }));
          } else if (area === 'FAQ' && res.payload.items) {
            setFaqForm(res.payload);
            setInitialStates(i => ({ ...i, FAQ: JSON.stringify(res.payload) }));
          } else if (area === 'CONTACT') {
            setContactForm(prev => {
              const mapped = { ...prev, ...res.payload, socialLinks: normalizeSocialSettings(res.payload.socialLinks ?? prev.socialLinks) };
              setInitialStates(i => ({ ...i, CONTACT: JSON.stringify(mapped) }));
              return mapped;
            });
          }
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Reloaded ${area} draft.`,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        setLoadErrors(prev => ({ ...prev, [area]: res.message || 'Load failed' }));
      }
    } catch (err) {
      setLoadErrors(prev => ({ ...prev, [area]: err.message || 'Network error' }));
    } finally {
      setLoading(false);
    }
  };

  // Load all CMS draft data — API returns `payload`, not `draft`
  useEffect(() => {
    let mounted = true;
    async function loadAllCms() {
      setLoading(true);
      try {
        const [homeRes, aboutRes, pagesRes, regTextRes, notRes, faqRes, conRes] = await Promise.all([
          adminService.cms.getArea('HOMEPAGE').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('ABOUT').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('PAGES').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('REGISTRATION_TEXT').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('NOTICES').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('FAQ').catch(e => ({ success: false, message: e.message })),
          adminService.cms.getArea('CONTACT').catch(e => ({ success: false, message: e.message }))
        ]);

        if (mounted) {
          const errors = {};
          const init = {};

          if (homeRes.success && homeRes.payload) {
            setHomepageForm(prev => {
              const mapped = mapHomepageDraft(homeRes.payload, prev);
              init.HOMEPAGE = JSON.stringify(mapped);
              return mapped;
            });
          } else if (!homeRes.success) {
            errors.HOMEPAGE = homeRes.message || 'Failed to load';
          }

          if (aboutRes.success && aboutRes.payload) {
            setAboutForm(prev => {
              const mapped = { ...prev, ...aboutRes.payload };
              init.ABOUT = JSON.stringify(mapped);
              return mapped;
            });
          } else if (!aboutRes.success) {
            errors.ABOUT = aboutRes.message || 'Failed to load';
          }

          if (pagesRes.success && pagesRes.payload) {
            setPagesForm(prev => {
              const mapped = { ...prev, ...pagesRes.payload };
              init.PAGES = JSON.stringify(mapped);
              return mapped;
            });
          } else if (!pagesRes.success) {
            errors.PAGES = pagesRes.message || 'Failed to load';
          }

          if (regTextRes.success && regTextRes.payload) {
            setRegTextForm(prev => {
              const mapped = { ...prev, ...regTextRes.payload };
              init.REGISTRATION_TEXT = JSON.stringify(mapped);
              return mapped;
            });
          } else if (!regTextRes.success) {
            errors.REGISTRATION_TEXT = regTextRes.message || 'Failed to load';
          }

          if (notRes.success && notRes.payload?.items) {
            setNotices(notRes.payload.items);
            init.NOTICES = JSON.stringify(notRes.payload.items);
          } else if (!notRes.success) {
            errors.NOTICES = notRes.message || 'Failed to load';
          }

          if (faqRes.success && faqRes.payload?.items) {
            setFaqForm(faqRes.payload);
            init.FAQ = JSON.stringify(faqRes.payload);
          } else if (!faqRes.success) {
            errors.FAQ = faqRes.message || 'Failed to load';
          }

          if (conRes.success && conRes.payload) {
            setContactForm(prev => {
              const mapped = { ...prev, ...conRes.payload, socialLinks: normalizeSocialSettings(conRes.payload.socialLinks ?? prev.socialLinks) };
              init.CONTACT = JSON.stringify(mapped);
              return mapped;
            });
          } else if (!conRes.success) {
            errors.CONTACT = conRes.message || 'Failed to load';
          }

          setLoadErrors(errors);
          setInitialStates(init);
        }
      } catch (err) {
        console.error('[CMS] Failed to load CMS draft data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAllCms();
    return () => { mounted = false; };
  }, []);

  const getCurrentTabData = (tab) => {
    switch (tab) {
      case 'HOMEPAGE': return homepageForm;
      case 'ABOUT': return aboutForm;
      case 'PAGES': return pagesForm;
      case 'REGISTRATION_TEXT': return regTextForm;
      case 'NOTICES': return notices;
      case 'FAQ': return faqForm;
      case 'CONTACT': return contactForm;
      default: return null;
    }
  };

  const isCurrentTabDirty = Boolean(
    initialStates[activeTab] &&
    getCurrentTabData(activeTab) &&
    JSON.stringify(getCurrentTabData(activeTab)) !== initialStates[activeTab]
  );

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isCurrentTabDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCurrentTabDirty]);

  const handleSwitchTab = async (newTab) => {
    if (newTab === activeTab) return;
    if (isCurrentTabDirty) {
      const result = await Swal.fire({
        title: 'Unsaved Changes',
        text: `You have unsaved changes in ${activeTab}. Would you like to save before switching tabs?`,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Save Draft & Switch',
        denyButtonText: 'Discard Changes',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: '#B91C1C'
      });

      if (result.isConfirmed) {
        await handleSaveDraft(true);
        setActiveTab(newTab);
        setSearchParams({ tab: newTab });
      } else if (result.isDenied) {
        const initial = initialStates[activeTab];
        if (initial) {
          const parsed = JSON.parse(initial);
          if (activeTab === 'HOMEPAGE') setHomepageForm(parsed);
          else if (activeTab === 'ABOUT') setAboutForm(parsed);
          else if (activeTab === 'PAGES') setPagesForm(parsed);
          else if (activeTab === 'REGISTRATION_TEXT') setRegTextForm(parsed);
          else if (activeTab === 'NOTICES') setNotices(parsed);
          else if (activeTab === 'FAQ') setFaqForm(parsed);
          else if (activeTab === 'CONTACT') setContactForm(parsed);
        }
        setActiveTab(newTab);
        setSearchParams({ tab: newTab });
      }
      return;
    }
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Save draft for current active tab — check result before showing success
  const handleSaveDraft = async (silent = false) => {
    if (loadErrors[activeTab]) {
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Save Locked',
          text: `Cannot save because ${activeTab} failed to load from the server. Please reload first to prevent losing data.`,
          confirmButtonColor: '#B91C1C'
        });
      }
      return;
    }

    setSaving(true);
    try {
      let res;
      let savedData;
      if (activeTab === 'HOMEPAGE') {
        savedData = normalizeHomepagePayload(homepageForm);
        res = await adminService.cms.saveDraft('HOMEPAGE', savedData);
      } else if (activeTab === 'ABOUT') {
        savedData = aboutForm;
        res = await adminService.cms.saveDraft('ABOUT', aboutForm);
      } else if (activeTab === 'PAGES') {
        savedData = pagesForm;
        res = await adminService.cms.saveDraft('PAGES', pagesForm);
      } else if (activeTab === 'REGISTRATION_TEXT') {
        savedData = regTextForm;
        res = await adminService.cms.saveDraft('REGISTRATION_TEXT', regTextForm);
      } else if (activeTab === 'NOTICES') {
        savedData = notices;
        res = await adminService.cms.saveDraft('NOTICES', { items: notices });
      } else if (activeTab === 'FAQ') {
        savedData = faqForm;
        res = await adminService.cms.saveDraft('FAQ', faqForm);
      } else if (activeTab === 'CONTACT') {
        savedData = contactForm;
        res = await adminService.cms.saveDraft('CONTACT', contactForm);
      } else {
        return; // Unknown tab — do nothing
      }

      if (!res?.success) {
        if (!silent) {
          Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: res?.message || 'An error occurred while saving the draft. Please try again.',
            confirmButtonColor: '#B91C1C'
          });
        }
        return;
      }

      // Mark clean
      if (savedData) {
        setInitialStates(prev => ({ ...prev, [activeTab]: JSON.stringify(savedData) }));
      }

      if (!silent) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Draft for ${activeTab} saved successfully.`,
          showConfirmButton: false,
          timer: 1800
        });
      }
    } catch (err) {
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: err?.message || 'Unexpected error while saving draft.',
          confirmButtonColor: '#B91C1C'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    try {
      await handleSaveDraft(true);
    } catch (_) {}
    setPreviewModalOpen(true);
  };

  // Publish live — check result before showing success
  const handlePublishLive = async () => {
    if (loadErrors[activeTab]) {
      Swal.fire({
        icon: 'error',
        title: 'Publish Locked',
        text: `Cannot publish because ${activeTab} failed to load from the server. Please reload first to prevent data loss.`,
        confirmButtonColor: '#B91C1C'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Publish Live to Public Website?',
      text: `All saved draft modifications in ${activeTab} will immediately reflect on the live website.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B91C1C',
      confirmButtonText: 'Yes, Publish Live'
    });

    if (confirm.isConfirmed) {
      setPublishing(true);
      try {
        // Save draft first and verify success
        let saveRes;
        let savedData;
        if (activeTab === 'HOMEPAGE') {
          savedData = normalizeHomepagePayload(homepageForm);
          saveRes = await adminService.cms.saveDraft('HOMEPAGE', savedData);
        } else if (activeTab === 'ABOUT') {
          savedData = aboutForm;
          saveRes = await adminService.cms.saveDraft('ABOUT', aboutForm);
        } else if (activeTab === 'PAGES') {
          savedData = pagesForm;
          saveRes = await adminService.cms.saveDraft('PAGES', pagesForm);
        } else if (activeTab === 'REGISTRATION_TEXT') {
          savedData = regTextForm;
          saveRes = await adminService.cms.saveDraft('REGISTRATION_TEXT', regTextForm);
        } else if (activeTab === 'NOTICES') {
          savedData = notices;
          saveRes = await adminService.cms.saveDraft('NOTICES', { items: notices });
        } else if (activeTab === 'FAQ') {
          savedData = faqForm;
          saveRes = await adminService.cms.saveDraft('FAQ', faqForm);
        } else if (activeTab === 'CONTACT') {
          savedData = contactForm;
          saveRes = await adminService.cms.saveDraft('CONTACT', contactForm);
        } else {
          saveRes = { success: true };
        }

        if (!saveRes?.success) {
          Swal.fire({
            icon: 'error',
            title: 'Publish Failed',
            text: saveRes?.message || 'Could not save draft before publishing.',
            confirmButtonColor: '#B91C1C'
          });
          return;
        }

        if (savedData) {
          setInitialStates(prev => ({ ...prev, [activeTab]: JSON.stringify(savedData) }));
        }

        const pubRes = await adminService.cms.publishArea(activeTab);
        if (!pubRes?.success) {
          Swal.fire({
            icon: 'error',
            title: 'Publish Failed',
            text: pubRes?.message || 'Could not publish content. Please try again.',
            confirmButtonColor: '#B91C1C'
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Published Live',
          text: `${activeTab} content has been published to the live public site.`,
          confirmButtonColor: '#B91C1C'
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Publish Failed',
          text: err?.message || 'Unexpected error during publish.',
          confirmButtonColor: '#B91C1C'
        });
      } finally {
        setPublishing(false);
      }
    }
  };

  const handleAddNotice = (e) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;
    const newNotice = {
      id: Date.now(),
      text: newNoticeText.trim(),
      linkLabel: newNoticeLink.trim() ? 'Learn More' : '',
      linkUrl: newNoticeLink.trim(),
      visible: true,
      order: notices.length + 1,
      expiresAt: null
    };
    setNotices([...notices, newNotice]);
    setNewNoticeText('');
    setNewNoticeLink('');
  };

  const handleToggleNotice = (id) => {
    setNotices(notices.map(n => n.id === id ? { ...n, visible: !n.visible } : n));
  };

  const handleDeleteNotice = (id) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  // FAQ Handlers
  const handleSaveFaq = (e) => {
    e.preventDefault();
    if (!faqModalItem?.item?.question?.trim() || !faqModalItem?.item?.answer?.trim()) return;

    if (faqModalItem.mode === 'create') {
      const newF = {
        id: `faq-${Date.now()}`,
        question: faqModalItem.item.question.trim(),
        answer: faqModalItem.item.answer.trim(),
        category: faqModalItem.item.category || 'general',
        order: faqs.length + 1,
        isActive: true,
        showOnHome: Boolean(faqModalItem.item.showOnHome)
      };
      setFaqs([...faqs, newF]);
    } else {
      setFaqs(faqs.map(f => f.id === faqModalItem.item.id ? { ...f, ...faqModalItem.item } : f));
    }
    setFaqModalItem(null);
  };

  const handleDeleteFaq = (id) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };

  const handleToggleFaqHome = (id) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, showOnHome: !f.showOnHome } : f));
  };

  if (loading) {
    return <LoadingState message="Loading Website CMS Drafts..." />;
  }

  if (!isSuperAdmin && availableTabs.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          You do not have permission to edit global website CMS content. Contact a Super Administrator for privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Back to Camps Breadcrumb Link */}
      <div>
        <Link
          to="/admin/camp"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Camps</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            GLOBAL WEBSITE CMS · PUBLIC CONTENT
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Website CMS
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-300 text-amber-800">
              ★ Active Live Camp: BDC {campYear}
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        {activeTab === 'GALLERY' ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="/gallery"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>View Public Gallery</span>
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-wrap">
            {isCurrentTabDirty && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Unsaved Changes</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>Preview Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              disabled={saving || publishing || Boolean(loadErrors[activeTab])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handlePublishLive}
              disabled={saving || publishing || Boolean(loadErrors[activeTab])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation Ribbon */}
      <div className="flex items-center gap-2 pt-1 border-b border-slate-200 pb-3 overflow-x-auto">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const tabData = getCurrentTabData(tab.key);
          const tabIsDirty = Boolean(
            initialStates[tab.key] &&
            tabData &&
            JSON.stringify(tabData) !== initialStates[tab.key]
          );
          const tabHasError = Boolean(loadErrors[tab.key]);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSwitchTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer relative ${
                isActive
                  ? 'bg-[#B91C1C] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tabIsDirty && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-300' : 'bg-amber-500'}`} title="Unsaved changes in this tab" />
              )}
              {tabHasError && (
                <AlertTriangle className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-red-500'}`} title="Failed to load" />
              )}
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Load Error Banner */}
      {loadErrors[activeTab] && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-red-800">
                Failed to load saved draft for {activeTab}
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                {loadErrors[activeTab]}. Saving and publishing are disabled to protect against overwriting existing data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => reloadArea(activeTab)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: HOMEPAGE CONTENT                                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'HOMEPAGE' && (
        <div className="space-y-6">
          {/* Card 1: Hero Banner Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hero Banner Section
                </h3>
                <p className="text-xs text-slate-500">
                  Main headline, tag, supporting text, CTA actions, and background photograph.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={homepageForm.hero.eyebrow}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Headline (multi-line supported)
                </label>
                <input
                  type="text"
                  value={homepageForm.hero.headline}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, headline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supporting Subtitle (strictly 2 lines on desktop)
              </label>
              <textarea
                rows={2}
                value={homepageForm.hero.description}
                onChange={(e) => setHomepageForm({
                  ...homepageForm,
                  hero: { ...homepageForm.hero, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Button Label
                </label>
                <input
                  type="text"
                  value={homepageForm.hero.primaryCtaLabel}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, primaryCtaLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary Button Label
                </label>
                <input
                  type="text"
                  value={homepageForm.hero.secondaryCtaLabel}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, secondaryCtaLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary Button URL
                </label>
                <input
                  type="text"
                  value={homepageForm.hero.secondaryCtaUrl}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    hero: { ...homepageForm.hero, secondaryCtaUrl: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <HeroPhotosEditor slides={homepageForm.hero.slides || []} onChange={slides => setHomepageForm(previous => ({ ...previous, hero: { ...previous.hero, slides } }))} />
          </div>

          {/* Card 2: About BDC Section (Section 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  About BDC Section
                </h3>
                <p className="text-xs text-slate-500">
                  Homepage Section 3: student initiative description, CTA button, and 5:3 landscape photo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Tag
                </label>
                <input
                  type="text"
                  value={homepageForm.about.eyebrow}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    about: { ...homepageForm.about, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={homepageForm.about.headline}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    about: { ...homepageForm.about, headline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description Paragraph
              </label>
              <textarea
                rows={3}
                value={homepageForm.about.description}
                onChange={(e) => setHomepageForm({
                  ...homepageForm,
                  about: { ...homepageForm.about, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Button Label
                </label>
                <input
                  type="text"
                  value={homepageForm.about.ctaLabel}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    about: { ...homepageForm.about, ctaLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Button Target
                </label>
                <input
                  type="text"
                  value={homepageForm.about.ctaUrl}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    about: { ...homepageForm.about, ctaUrl: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>

            <p className="text-sm text-slate-600">This carousel uses the three photos below the About page hero. Manage them in the About Page tab.</p>

          </div>

          <LeadershipEditor value={homepageForm.leadership} onChange={leadership => setHomepageForm(previous => ({ ...previous, leadership }))} />

          {/* Card 3: Our Impact Statistics Section (Section 4) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Our Impact Counters
                </h3>
                <p className="text-xs text-slate-500">
                  Verified platform statistics displayed with count-up animations on Home and About pages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Blood Units Collected
                </div>
                <input
                  type="number"
                  min="0"
                  value={homepageForm.impact.bloodUnits}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    impact: { ...homepageForm.impact, bloodUnits: Number(e.target.value) }
                  })}
                  className="w-28 text-center text-xl font-extrabold text-[#B91C1C] px-2 py-1 rounded-lg border border-slate-300 mx-auto block"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Formatted: {toSafeNumber(homepageForm.impact?.bloodUnits).toLocaleString()}+</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Voluntary Donors
                </div>
                <input
                  type="number"
                  min="0"
                  value={homepageForm.impact.donorsCount}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    impact: { ...homepageForm.impact, donorsCount: Number(e.target.value) }
                  })}
                  className="w-28 text-center text-xl font-extrabold text-[#B91C1C] px-2 py-1 rounded-lg border border-slate-300 mx-auto block"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Formatted: {toSafeNumber(homepageForm.impact?.donorsCount).toLocaleString()}+</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Camps Organised
                </div>
                <input
                  type="number"
                  min="0"
                  value={homepageForm.impact.campsCount}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    impact: { ...homepageForm.impact, campsCount: Number(e.target.value) }
                  })}
                  className="w-28 text-center text-xl font-extrabold text-[#B91C1C] px-2 py-1 rounded-lg border border-slate-300 mx-auto block"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Formatted: {homepageForm.impact.campsCount}</span>
              </div>
            </div>

            <div className="pt-2">
              <ImagePickerField
                label="Impact Photographic Background Banner"
                allowRemove
                value={homepageForm.impact.bannerUrl ?? '/assets/bdc_impact_slightly_bright_webp.webp'}
                onChange={(url) => setHomepageForm({
                  ...homepageForm,
                  impact: { ...homepageForm.impact, bannerUrl: url }
                })}
                aspectRatio={16 / 9}
                cropShape="rect"
                kind="HERO"
                helpText="Dark or high-contrast background banner behind live counters."
              />
            </div>
          </div>

          {/* Card 4: Our Inspiration Tribute (Section 8) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Our Inspiration Tribute
                </h3>
                <p className="text-xs text-slate-500">
                  Homepage Section 8: Swami Keshvanand portrait, core slogans, and ideals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Label
                </label>
                <input
                  type="text"
                  value={homepageForm.inspiration.sectionLabel}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    inspiration: { ...homepageForm.inspiration, sectionLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inspiration Figure Name
                </label>
                <input
                  type="text"
                  value={homepageForm.inspiration.name}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    inspiration: { ...homepageForm.inspiration, name: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tribute Description
              </label>
              <textarea
                rows={2}
                value={homepageForm.inspiration.description}
                onChange={(e) => setHomepageForm({
                  ...homepageForm,
                  inspiration: { ...homepageForm.inspiration, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Left Slogans (comma-separated)
                </label>
                <input
                  type="text"
                  value={homepageForm.inspiration.slogansLeft}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    inspiration: { ...homepageForm.inspiration, slogansLeft: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Right Slogans (comma-separated)
                </label>
                <input
                  type="text"
                  value={homepageForm.inspiration.slogansRight}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    inspiration: { ...homepageForm.inspiration, slogansRight: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Closing Statement
              </label>
              <input
                type="text"
                value={homepageForm.inspiration.closingStatement}
                onChange={(e) => setHomepageForm({
                  ...homepageForm,
                  inspiration: { ...homepageForm.inspiration, closingStatement: e.target.value }
                })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div className="pt-2">
              <ImagePickerField
                label="Inspiration Figure Portrait"
                allowRemove
                value={homepageForm.inspiration.portraitUrl ?? '/assets/inspiration_swamiji.png'}
                onChange={(url) => setHomepageForm({
                  ...homepageForm,
                  inspiration: { ...homepageForm.inspiration, portraitUrl: url }
                })}
                aspectRatio={1}
                cropShape="round"
                kind="HERO"
                helpText="Swami Keshvanand portrait photograph (1:1 circular crop)."
              />
            </div>
          </div>

          {/* Card 5: Final Registration CTA Band (Section 10) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                5
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Final Registration CTA Band
                </h3>
                <p className="text-xs text-slate-500">
                  Homepage Section 10: bottom crimson call-to-action banner before the footer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={homepageForm.ctaBand.eyebrow}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    ctaBand: { ...homepageForm.ctaBand, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={homepageForm.ctaBand.headline1}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    ctaBand: { ...homepageForm.ctaBand, headline1: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline Line 2
                </label>
                <input
                  type="text"
                  value={homepageForm.ctaBand.headline2}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    ctaBand: { ...homepageForm.ctaBand, headline2: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={homepageForm.ctaBand.buttonLabel}
                  onChange={(e) => setHomepageForm({
                    ...homepageForm,
                    ctaBand: { ...homepageForm.ctaBand, buttonLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB: ABOUT PAGE CONTENT                                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ABOUT' && (
        <div className="space-y-6">
          {/* Card 1: About Hero */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  About Page Hero Banner
                </h3>
                <p className="text-xs text-slate-500">
                  Top introduction banner, headline, and backdrop photograph for /about.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={aboutForm.hero?.eyebrow || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    hero: { ...aboutForm.hero, eyebrow: e.target.value }
                  })}
                  placeholder="e.g. About BDC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Headline
                </label>
                <input
                  type="text"
                  value={aboutForm.hero?.headline || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    hero: { ...aboutForm.hero, headline: e.target.value }
                  })}
                  placeholder="e.g. A student initiative for a healthier tomorrow."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supporting Description
              </label>
              <textarea
                rows={3}
                value={aboutForm.hero?.description || ''}
                onChange={(e) => setAboutForm({
                  ...aboutForm,
                  hero: { ...aboutForm.hero, description: e.target.value }
                })}
                placeholder="Description of the initiative..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div className="pt-2">
              <ImagePickerField
                label="Hero Backdrop Photograph (Optional)"
                allowRemove
                value={aboutForm.hero?.heroPhotoUrl || ''}
                onChange={(url) => setAboutForm({
                  ...aboutForm,
                  hero: { ...aboutForm.hero, heroPhotoUrl: url }
                })}
                aspectRatio={16 / 9}
                cropShape="rect"
                kind="SITE"
                area="about"
                helpText="Full-width backdrop photograph behind About hero title and description. Leave empty for default crimson brand."
              />
            </div>
          </div>

          {/* Card 2: 3 Introduction Photos */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Three-Photo Introduction Showcase
                </h3>
                <p className="text-xs text-slate-500">
                  Featured campaign moments displayed in the 3-column photo grid on /about.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(aboutForm.photos || []).map((photo, pIdx) => (
                <div key={photo.id || pIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Photo Slot {pIdx + 1} {pIdx === 1 ? '(Center Highlight)' : ''}
                    </span>
                  </div>

                  <ImagePickerField
                    label={`Showcase Image ${pIdx + 1}`}
                    value={photo.url || ''}
                    allowRemove
                    onChange={(url) => {
                      const updated = [...(aboutForm.photos || [])];
                      updated[pIdx] = { ...updated[pIdx], url };
                      setAboutForm({ ...aboutForm, photos: updated });
                    }}
                    onRemove={() => {
                      const updated = [...(aboutForm.photos || [])];
                      updated[pIdx] = { ...updated[pIdx], url: '' };
                      setAboutForm({ ...aboutForm, photos: updated });
                    }}
                    aspectRatio={4 / 3}
                    cropShape="rect"
                    kind="SITE"
                    area="about"
                    helpText={`Slot ${pIdx + 1} showcase image (4:3 aspect ratio)`}
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Label / Badge Text
                    </label>
                    <input
                      type="text"
                      value={photo.label || ''}
                      onChange={(e) => {
                        const updated = [...aboutForm.photos];
                        updated[pIdx] = { ...updated[pIdx], label: e.target.value };
                        setAboutForm({ ...aboutForm, photos: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Alt Description
                    </label>
                    <input
                      type="text"
                      value={photo.alt || ''}
                      onChange={(e) => {
                        const updated = [...aboutForm.photos];
                        updated[pIdx] = { ...updated[pIdx], alt: e.target.value };
                        setAboutForm({ ...aboutForm, photos: updated });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Our Story */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Our Story Section
                </h3>
                <p className="text-xs text-slate-500">
                  The narrative explaining how BDC began and the volunteer ethos behind it.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Tag / Eyebrow
                </label>
                <input
                  type="text"
                  value={aboutForm.story?.eyebrow || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    story: { ...aboutForm.story, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Story Headline
                </label>
                <input
                  type="text"
                  value={aboutForm.story?.headline || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    story: { ...aboutForm.story, headline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Story Paragraph 1
                </label>
                <textarea
                  rows={5}
                  value={aboutForm.story?.paragraph1 || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    story: { ...aboutForm.story, paragraph1: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Story Paragraph 2
                </label>
                <textarea
                  rows={5}
                  value={aboutForm.story?.paragraph2 || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    story: { ...aboutForm.story, paragraph2: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Mission, Vision & Values */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Mission, Vision & Core Values
                </h3>
                <p className="text-xs text-slate-500">
                  Guiding principles of the campaign displayed in 3 distinct pillars.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Mission Title
                </label>
                <input
                  type="text"
                  value={aboutForm.values?.mission?.title || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      mission: { ...aboutForm.values?.mission, title: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
                <label className="block text-xs font-bold text-slate-800">
                  Mission Description
                </label>
                <textarea
                  rows={4}
                  value={aboutForm.values?.mission?.description || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      mission: { ...aboutForm.values?.mission, description: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Vision Title
                </label>
                <input
                  type="text"
                  value={aboutForm.values?.vision?.title || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      vision: { ...aboutForm.values?.vision, title: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
                <label className="block text-xs font-bold text-slate-800">
                  Vision Description
                </label>
                <textarea
                  rows={4}
                  value={aboutForm.values?.vision?.description || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      vision: { ...aboutForm.values?.vision, description: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Values Title
                </label>
                <input
                  type="text"
                  value={aboutForm.values?.values?.title || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      values: { ...aboutForm.values?.values, title: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
                <label className="block text-xs font-bold text-slate-800">
                  Values Description
                </label>
                <textarea
                  rows={4}
                  value={aboutForm.values?.values?.description || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    values: {
                      ...aboutForm.values,
                      values: { ...aboutForm.values?.values, description: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Bottom Call To Action */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                5
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  About Page Call-To-Action Band
                </h3>
                <p className="text-xs text-slate-500">
                  Closing invitation banner directing readers to register or volunteer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CTA Headline
                </label>
                <input
                  type="text"
                  value={aboutForm.cta?.headline || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    cta: { ...aboutForm.cta, headline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={aboutForm.cta?.buttonLabel || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    cta: { ...aboutForm.cta, buttonLabel: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CTA Description
                </label>
                <textarea
                  rows={2}
                  value={aboutForm.cta?.description || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    cta: { ...aboutForm.cta, description: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Button Target URL
                </label>
                <input
                  type="text"
                  value={aboutForm.cta?.buttonUrl || ''}
                  onChange={(e) => setAboutForm({
                    ...aboutForm,
                    cta: { ...aboutForm.cta, buttonUrl: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB: GLOBAL PHOTO GALLERY ALBUMS                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'GALLERY' && (
        <GalleryAdminManager camps={camps || []} />
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB: PAGE HEADERS & COPY                                                 */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PAGES' && (
        <div className="space-y-6">
          {/* Card 1: Team Page Copy */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Team Page Headers & Description
                </h3>
                <p className="text-xs text-slate-500">
                  Global copy displayed on /team above the active camp roster.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={pagesForm.team?.eyebrow || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    team: { ...pagesForm.team, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pagesForm.team?.title || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    team: { ...pagesForm.team, title: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Description
              </label>
              <textarea
                rows={2}
                value={pagesForm.team?.description || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  team: { ...pagesForm.team, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Empty Roster Notice (shown when no roster published)
              </label>
              <textarea
                rows={2}
                value={pagesForm.team?.emptyMessage || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  team: { ...pagesForm.team, emptyMessage: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>

          {/* Card 2: Gallery Page Copy */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gallery Page Headers & Description
                </h3>
                <p className="text-xs text-slate-500">
                  Global copy displayed on /gallery above the photo albums.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={pagesForm.gallery?.eyebrow || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    gallery: { ...pagesForm.gallery, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pagesForm.gallery?.title || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    gallery: { ...pagesForm.gallery, title: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Description
              </label>
              <textarea
                rows={2}
                value={pagesForm.gallery?.description || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  gallery: { ...pagesForm.gallery, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Empty Gallery Notice (shown when photos list is empty)
              </label>
              <textarea
                rows={2}
                value={pagesForm.gallery?.emptyMessage || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  gallery: { ...pagesForm.gallery, emptyMessage: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>

          {/* Card 3: Supporters / Partners Page Copy */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Supporters & Partners Page Headers
                </h3>
                <p className="text-xs text-slate-500">
                  Global copy displayed on /sponsors above the partner logos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={pagesForm.supporters?.eyebrow || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    supporters: { ...pagesForm.supporters, eyebrow: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pagesForm.supporters?.title || ''}
                  onChange={(e) => setPagesForm({
                    ...pagesForm,
                    supporters: { ...pagesForm.supporters, title: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Description
              </label>
              <textarea
                rows={2}
                value={pagesForm.supporters?.description || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  supporters: { ...pagesForm.supporters, description: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Empty Partners Notice (shown when no partners configured)
              </label>
              <textarea
                rows={2}
                value={pagesForm.supporters?.emptyMessage || ''}
                onChange={(e) => setPagesForm({
                  ...pagesForm,
                  supporters: { ...pagesForm.supporters, emptyMessage: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB: REGISTRATION PAGE COPY                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REGISTRATION_TEXT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-rose-50 text-[#B91C1C] font-bold text-xs flex items-center justify-center border border-rose-200 shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Donor Registration Guidance & Help Copy
                </h3>
                <p className="text-xs text-slate-500">
                  Instructions, eligibility criteria, and helpdesk guidance displayed on the /register form.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Form Title
              </label>
              <input
                type="text"
                value={regTextForm.title || ''}
                onChange={(e) => setRegTextForm({ ...regTextForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Donor Instructions / Subtitle
              </label>
              <textarea
                rows={3}
                value={regTextForm.description || ''}
                onChange={(e) => setRegTextForm({ ...regTextForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eligibility Notice
              </label>
              <textarea
                rows={2}
                value={regTextForm.eligibilityNotice || ''}
                onChange={(e) => setRegTextForm({ ...regTextForm, eligibilityNotice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Helpdesk & Support Text
              </label>
              <textarea
                rows={2}
                value={regTextForm.helpText || ''}
                onChange={(e) => setRegTextForm({ ...regTextForm, helpText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: NOTICES & ANNOUNCEMENTS                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'NOTICES' && (
        <div className="space-y-6">
          {/* Add Notice Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Create New Notice
            </h3>
            <form onSubmit={handleAddNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Announcement Text *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Online donor registrations are open for BDC 2026."
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Link URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /register"
                  value={newNoticeLink}
                  onChange={(e) => setNewNoticeLink(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Notice</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notices Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Notice Announcement</th>
                  <th className="px-5 py-3.5">Action Link</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {notices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-medium text-slate-900 max-w-md">
                      {n.text}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                      {n.linkUrl || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleNotice(n.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                          n.visible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {n.visible ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(n.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No notices registered. Add a notice using the form above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: FAQ MANAGEMENT                                                    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'FAQ' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">FAQ Page Images</h3>
              <p className="text-xs text-slate-500 mt-1">Choose images for the two FAQ sections. Save a draft or publish using the controls above.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {FAQ_IMAGE_SLOTS.map(slot => (
                <ImagePickerField
                  key={slot.key}
                  label={slot.title}
                  value={faqForm.images?.[slot.key]?.url || ''}
                  onChange={(url, assetId) => setFaqForm(prev => ({
                    ...prev,
                    images: { ...prev.images, [slot.key]: { url, asset_id: assetId, alt: slot.title } }
                  }))}
                  onRemove={() => setFaqForm(prev => ({ ...prev, images: { ...prev.images, [slot.key]: null } }))}
                  kind="SITE"
                  area="faq"
                  aspectRatio={4 / 3}
                  recommendation="Landscape photo, cropped to 4:3. Removing the image restores the placeholder."
                />
              ))}
            </div>
          </div>
          <DonationProcessTextEditor value={faqForm.process} onChange={process => setFaqForm(previous => ({ ...previous, process }))} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Frequently Asked Questions ({faqs.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Single source of truth for both Homepage FAQ section and the dedicated /faq page.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFaqModalItem({
                mode: 'create',
                item: { question: '', answer: '', category: 'general', showOnHome: false }
              })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Question & Answer</th>
                  <th className="px-5 py-3.5 text-center">Home Section</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        f.category === 'donation'
                          ? 'bg-rose-50 text-[#B91C1C] border border-rose-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}>
                        {f.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xl">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {f.question}
                      </div>
                      <div className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                        {f.answer}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleToggleFaqHome(f.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                          f.showOnHome
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {f.showOnHome ? '★ On Home' : 'Page only'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right align-top space-x-2">
                      <button
                        type="button"
                        onClick={() => setFaqModalItem({ mode: 'edit', item: { ...f } })}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(f.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQ Add/Edit Modal */}
          {faqModalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {faqModalItem.mode === 'create' ? 'Add FAQ Item' : 'Edit FAQ Item'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFaqModalItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveFaq} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={faqModalItem.item.category || 'general'}
                      onChange={(e) => setFaqModalItem({
                        ...faqModalItem,
                        item: { ...faqModalItem.item, category: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                    >
                      <option value="general">General Questions</option>
                      <option value="donation">Donation Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Question *</label>
                    <input
                      type="text"
                      value={faqModalItem.item.question}
                      onChange={(e) => setFaqModalItem({
                        ...faqModalItem,
                        item: { ...faqModalItem.item, question: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Answer *</label>
                    <textarea
                      rows={4}
                      value={faqModalItem.item.answer}
                      onChange={(e) => setFaqModalItem({
                        ...faqModalItem,
                        item: { ...faqModalItem.item, answer: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(faqModalItem.item.showOnHome)}
                      onChange={(e) => setFaqModalItem({
                        ...faqModalItem,
                        item: { ...faqModalItem.item, showOnHome: e.target.checked }
                      })}
                    />
                    <span className="font-semibold text-slate-700">Display in top 5 on Homepage FAQ Section</span>
                  </label>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setFaqModalItem(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold cursor-pointer"
                    >
                      Save Question
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: CONTACT & FOOTER SETTINGS                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'CONTACT' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Contact Page & Platform Footer Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official institutional contacts, campus address, and social links displayed across public pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Contact Phone
              </label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Inquiries Email
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Campus Location Address
            </label>
            <textarea
              rows={2}
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Platform Footer Tagline
            </label>
            <input
              type="text"
              value={contactForm.footerTagline}
              onChange={(e) => setContactForm({ ...contactForm, footerTagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Social Media Channels
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contactForm.socialLinks.map((soc, idx) => (
                <div key={soc.id || idx} className="flex items-center gap-2">
                  <span className="w-24 text-xs font-semibold text-slate-600 shrink-0">
                    {soc.label}
                  </span>
                  <input
                    type="url"
                    value={soc.url}
                    onChange={(e) => {
                      const updated = [...contactForm.socialLinks];
                      updated[idx] = { ...updated[idx], url: e.target.value };
                      setContactForm({ ...contactForm, socialLinks: updated });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CMS Draft Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full ${previewDevice === 'mobile' ? 'max-w-[480px]' : 'max-w-6xl'} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300 animate-fade-in`}>
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight">
                  Draft Preview — {activeTab}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  BDC {campYear}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Device Selector */}
                <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-[#B91C1C] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-[#B91C1C] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile (390px)</span>
                  </button>
                </div>

                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                  title="Open live website in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Live Site</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Preview Canvas using Isolated Viewport Iframe */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-2 sm:p-4 flex justify-center items-center">
              <PreviewIframe device={previewDevice}>
                {activeTab === 'HOMEPAGE' && (
                  <div className="w-full">
                    <HomePage previewData={normalizeHomepagePayload(homepageForm)} />
                  </div>
                )}

                {activeTab === 'ABOUT' && (
                  <div className="w-full">
                    <AboutPage previewData={aboutForm} />
                  </div>
                )}

                {activeTab === 'PAGES' && (
                  <div className="p-6 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#981B24] block">
                        Team Page Header
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{pagesForm.team?.title}</h4>
                      <p className="text-xs text-slate-600">{pagesForm.team?.description}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#981B24] block">
                        Gallery Page Header
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{pagesForm.gallery?.title}</h4>
                      <p className="text-xs text-slate-600">{pagesForm.gallery?.description}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#981B24] block">
                        Supporters Page Header
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{pagesForm.supporters?.title}</h4>
                      <p className="text-xs text-slate-600">{pagesForm.supporters?.description}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'REGISTRATION_TEXT' && (
                  <div className="p-6 space-y-4">
                    <div className="bg-[#FAF4EB] border border-[#EAD7CF] rounded-2xl p-6 shadow-xs space-y-3">
                      <h3 className="font-serif text-lg font-bold text-[#102B46]">{regTextForm.title}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed">{regTextForm.description}</p>
                      {regTextForm.eligibilityNotice && (
                        <div className="p-3 bg-white rounded-xl border border-[#EAD7CF] text-xs text-slate-600">
                          <strong className="text-slate-800">Eligibility:</strong> {regTextForm.eligibilityNotice}
                        </div>
                      )}
                      {regTextForm.helpText && (
                        <div className="p-3 bg-white rounded-xl border border-[#EAD7CF] text-xs text-slate-600">
                          <strong className="text-slate-800">Support:</strong> {regTextForm.helpText}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'NOTICES' && (
                  <div className="p-6 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Active Notices Banner Preview ({notices.filter(n => n.visible).length} Active)
                      </h4>
                      {notices.filter(n => n.visible).length > 0 ? (
                        <div className="space-y-2">
                          {notices.filter(n => n.visible).map(n => (
                            <div key={n.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950">
                              <span>📢 {n.text}</span>
                              {n.linkUrl && (
                                <span className="text-[#B91C1C] font-semibold underline ml-2 shrink-0">
                                  {n.linkLabel || 'Learn More'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No visible notices configured in this draft.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'FAQ' && (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {FAQ_IMAGE_SLOTS.map(slot => <FaqSectionImage key={slot.key} {...slot} image={faqForm.images?.[slot.key]} />)}
                    </div>
                    <DonationProcess content={faqForm.process} />
                    <div className="bg-white border border-[#F3DEDA] rounded-2xl p-6 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#981B24] mb-2">
                        Frequently Asked Questions ({faqs.filter(f => f.isActive).length} Active)
                      </h4>
                      <div className="divide-y divide-slate-100 space-y-3">
                        {faqs.filter(f => f.isActive).map(f => (
                          <div key={f.id} className="pt-3 first:pt-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#102B46] mb-1">
                              Q: {f.question}
                            </p>
                            <p className="text-xs text-slate-600 pl-4 border-l-2 border-[#981B24]/40">
                              {f.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'CONTACT' && (
                  <div className="p-6 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Contact Information Preview
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-500 block mb-0.5">Email</span>
                          <span className="text-slate-800 font-medium">{contactForm.email}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-500 block mb-0.5">Phone</span>
                          <span className="text-slate-800 font-medium">{contactForm.phone}</span>
                        </div>
                        <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl">
                          <span className="font-bold text-slate-500 block mb-0.5">Campus Address</span>
                          <span className="text-slate-800">{contactForm.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </PreviewIframe>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                This draft has been autosaved. Click Publish Live to push to production.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setPreviewModalOpen(false);
                    await handlePublishLive();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
