import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, ExternalLink, AlertCircle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import HeroWave from '../components/common/HeroWave.jsx';
import { api } from '../services/api.js';

export default function ContactPage() {
  const [settings, setSettings] = useState(null);
  const [coordinators, setCoordinators] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.settings.getPublic().then(res => {
      if (mounted && res.success && res.data) {
        setSettings(res.data);
      }
    }).catch(() => {});

    api.team.getAll().then(res => {
      if (mounted && res.success && res.data) {
        const teamList = [
          ...(res.data.chiefCoordinators || []),
          ...(res.data.studentCoordinators || [])
        ];
        const publicCoords = teamList.filter(c => c.show_phone_publicly && c.phone);
        setCoordinators(publicCoords);
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showUnavailableNotice, setShowUnavailableNotice] = useState(false);

  const validate = (values) => {
    const errs = {};
    if (!values.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (values.fullName.trim().length < 2) {
      errs.fullName = 'Please enter at least 2 characters.';
    }

    if (!values.email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (values.phone && values.phone.trim()) {
      const cleaned = values.phone.replace(/[\s()-]/g, '');
      if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
        errs.phone = 'Please enter a valid phone number (e.g. +91 98765 43210).';
      }
    }

    if (!values.subject.trim()) {
      errs.subject = 'Subject is required.';
    } else if (values.subject.trim().length < 3) {
      errs.subject = 'Subject must be at least 3 characters.';
    }

    if (!values.message.trim()) {
      errs.message = 'Message is required.';
    } else if (values.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters.';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name] || submitAttempted) {
      const validationErrors = validate({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validate(formData);
    setErrors(validationErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitSuccess(false);
    setShowUnavailableNotice(false);

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitting(true);
      try {
        const res = await api.contact.submit(formData);
        if (res.ok && res.success) {
          setSubmitSuccess(true);
          setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
          setTouched({});
          setSubmitAttempted(false);
        } else {
          setShowUnavailableNotice(true);
        }
      } catch {
        setShowUnavailableNotice(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#981B24] text-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pt-16 pb-24 lg:pb-28 animate-fade-in-up">
          {(settings?.heading ?? 'Contact Us') && <p className="text-xs font-bold tracking-widest uppercase text-[#F3DEDA] mb-3">{settings?.heading ?? 'Contact Us'}</p>}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-4">
            {settings?.site_title ? `Get in Touch · ${settings.site_title}` : 'Get in Touch'}
          </h1>
          {(settings?.intro ?? 'Have questions about upcoming blood donation camps, interested in volunteering, or exploring partnership opportunities? Reach out to our campaign team.') && <p className="text-[#F3DEDA] max-w-xl text-sm sm:text-base leading-relaxed">{settings?.intro ?? 'Have questions about upcoming blood donation camps, interested in volunteering, or exploring partnership opportunities? Reach out to our campaign team.'}</p>}
        </div>
        <HeroWave fill="#FFFDF9" />
      </section>

      {/* Main Content Container (aligned with public navbar margins) */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-12 sm:py-16">

        {/* Contact Details and Form Panel */}
        <div className="bg-[#FDF3EF] border border-[#F3DEDA] rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-xs mb-16 sm:mb-20">

          {/* Compact Contact-Details Row (above the form) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 sm:pb-10 border-b border-[#EAD7CF]">
            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#981B24] mb-0.5">
                  Phone Support
                </p>
                <h2 className="text-sm sm:text-base font-bold text-[#102B46] mb-1">Give Us a Call</h2>
                <a
                  href={`tel:${(settings?.contact_phone || '+91 141 3500300').replace(/\s/g, '')}`}
                  className="text-xs sm:text-sm font-semibold text-[#981B24] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#981B24] rounded inline-block"
                >
                  {settings?.contact_phone || '+91 141 3500300'}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#981B24] mb-0.5">
                  Email Inquiries
                </p>
                <h2 className="text-sm sm:text-base font-bold text-[#102B46] mb-1">Send an Email</h2>
                <a
                  href={`mailto:${settings?.contact_email || 'bdc@skit.ac.in'}`}
                  className="text-xs sm:text-sm font-semibold text-[#981B24] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#981B24] rounded inline-block"
                >
                  {settings?.contact_email || 'bdc@skit.ac.in'}
                </a>
              </div>
            </div>

            {/* Campus Address */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#981B24]/10 text-[#981B24] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-[#981B24] mb-0.5">
                  Campus Location
                </p>
                <h2 className="text-sm sm:text-base font-bold text-[#102B46] mb-1">SKIT Jaipur Campus</h2>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {settings?.campus_address || 'Swami Keshvanand Institute of Technology, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="pt-8 sm:pt-10">
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-[#981B24] mb-1">
                Direct Inquiry
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#102B46]">
                Leave Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-[#68717D] mt-1.5 max-w-xl">
                Fill in the details below and our team will get in touch with you shortly.
              </p>
            </div>

            {/* Persistent Inquiries Information Banner */}
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#4A5568] bg-[#FAF4EB] border border-[#EAD7CF] rounded-2xl p-4 mb-8">
              <Info className="w-4 h-4 text-[#981B24] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                <strong className="text-[#102B46]">Inquiries & Assistance:</strong> Submit your message below to reach the central BDC student coordination team, or reach us directly at{' '}
                <a
                  href="mailto:bdc@skit.ac.in"
                  className="font-semibold text-[#981B24] underline hover:text-[#7E141C]"
                >
                  bdc@skit.ac.in
                </a>.
              </p>
            </div>

            {/* Dynamic Submission Status Notice (shown if server error occurs) */}
            {showUnavailableNotice && (
              <div
                role="status"
                aria-live="polite"
                className="p-5 rounded-2xl bg-[#FFF5F5] border border-[#F3DEDA] text-[#102B46] mb-8 flex items-start gap-3.5 shadow-2xs"
              >
                <AlertCircle className="w-5 h-5 text-[#981B24] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 text-xs sm:text-sm">
                  <h4 className="font-bold text-[#981B24] text-sm sm:text-base mb-1">
                    Direct Server Delivery Unavailable
                  </h4>
                  <p className="text-[#4A5568] leading-relaxed mb-3">
                    We could not deliver your message automatically. To ensure your inquiry reaches the coordinators immediately, click below to open your email client:
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`mailto:bdc@skit.ac.in?subject=${encodeURIComponent(
                        formData.subject
                      )}&body=${encodeURIComponent(
                        `From: ${formData.fullName}\nEmail: ${formData.email}${
                          formData.phone ? `\nPhone: ${formData.phone}` : ''
                        }\n\nMessage:\n${formData.message}`
                      )}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#981B24] text-white hover:bg-[#7E141C] transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981B24]"
                    >
                      <Mail className="w-4 h-4" aria-hidden="true" />
                      <span>Send via Email Client</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowUnavailableNotice(false)}
                      className="text-xs text-[#68717D] hover:text-[#102B46] underline ml-1 cursor-pointer"
                    >
                      Dismiss notice
                    </button>
                  </div>
                </div>
              </div>
            )}
            {submitSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="mb-8 p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 shadow-xs"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900">Message Delivered Successfully</h3>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    Thank you! Your inquiry has been forwarded directly to the BDC central coordination inbox. Our team will get back to you shortly.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs sm:text-sm font-bold text-[#102B46] mb-1.5"
                  >
                    Full Name <span className="text-[#981B24]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.fullName && (touched.fullName || submitAttempted))}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#102B46] placeholder-[#9CA3AF] bg-white transition focus:outline-none focus:ring-2 ${
                      errors.fullName && (touched.fullName || submitAttempted)
                        ? 'border-[#981B24] focus:ring-[#981B24]/40 bg-[#FFFDFD]'
                        : 'border-[#EAD7CF] focus:ring-[#981B24]/40 focus:border-[#981B24]'
                    }`}
                  />
                  {errors.fullName && (touched.fullName || submitAttempted) && (
                    <p
                      id="fullName-error"
                      className="text-xs text-[#981B24] font-medium mt-1.5 flex items-center gap-1"
                      role="alert"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-bold text-[#102B46] mb-1.5"
                  >
                    Email Address <span className="text-[#981B24]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.email && (touched.email || submitAttempted))}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. rahul@example.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#102B46] placeholder-[#9CA3AF] bg-white transition focus:outline-none focus:ring-2 ${
                      errors.email && (touched.email || submitAttempted)
                        ? 'border-[#981B24] focus:ring-[#981B24]/40 bg-[#FFFDFD]'
                        : 'border-[#EAD7CF] focus:ring-[#981B24]/40 focus:border-[#981B24]'
                    }`}
                  />
                  {errors.email && (touched.email || submitAttempted) && (
                    <p
                      id="email-error"
                      className="text-xs text-[#981B24] font-medium mt-1.5 flex items-center gap-1"
                      role="alert"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs sm:text-sm font-bold text-[#102B46] mb-1.5"
                  >
                    Phone Number <span className="text-xs font-normal text-[#68717D]">(Optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    aria-invalid={Boolean(errors.phone && (touched.phone || submitAttempted))}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#102B46] placeholder-[#9CA3AF] bg-white transition focus:outline-none focus:ring-2 ${
                      errors.phone && (touched.phone || submitAttempted)
                        ? 'border-[#981B24] focus:ring-[#981B24]/40 bg-[#FFFDFD]'
                        : 'border-[#EAD7CF] focus:ring-[#981B24]/40 focus:border-[#981B24]'
                    }`}
                  />
                  {errors.phone && (touched.phone || submitAttempted) && (
                    <p
                      id="phone-error"
                      className="text-xs text-[#981B24] font-medium mt-1.5 flex items-center gap-1"
                      role="alert"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs sm:text-sm font-bold text-[#102B46] mb-1.5"
                  >
                    Subject <span className="text-[#981B24]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.subject && (touched.subject || submitAttempted))}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Volunteering Inquiry / Camp Collaboration"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#102B46] placeholder-[#9CA3AF] bg-white transition focus:outline-none focus:ring-2 ${
                      errors.subject && (touched.subject || submitAttempted)
                        ? 'border-[#981B24] focus:ring-[#981B24]/40 bg-[#FFFDFD]'
                        : 'border-[#EAD7CF] focus:ring-[#981B24]/40 focus:border-[#981B24]'
                    }`}
                  />
                  {errors.subject && (touched.subject || submitAttempted) && (
                    <p
                      id="subject-error"
                      className="text-xs text-[#981B24] font-medium mt-1.5 flex items-center gap-1"
                      role="alert"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.subject}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs sm:text-sm font-bold text-[#102B46] mb-1.5"
                >
                  Message <span className="text-[#981B24]" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errors.message && (touched.message || submitAttempted))}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Write your message, camp inquiries, or collaboration details here..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-[#102B46] placeholder-[#9CA3AF] bg-white transition resize-y focus:outline-none focus:ring-2 ${
                    errors.message && (touched.message || submitAttempted)
                      ? 'border-[#981B24] focus:ring-[#981B24]/40 bg-[#FFFDFD]'
                      : 'border-[#EAD7CF] focus:ring-[#981B24]/40 focus:border-[#981B24]'
                  }`}
                />
                {errors.message && (touched.message || submitAttempted) && (
                  <p
                    id="message-error"
                    className="text-xs text-[#981B24] font-medium mt-1.5 flex items-center gap-1"
                    role="alert"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              {/* Action Button & Required Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-[#981B24] text-white hover:bg-[#7E141C] transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#981B24]"
                >
                  <span>Send Message</span>
                </button>
                <span className="text-xs text-[#68717D]">
                  Fields marked with <span className="text-[#981B24] font-bold">*</span> are required.
                </span>
              </div>
            </form>
          </div>

          {/* Compact Coordinator Contacts Block within the contact area */}
          <div className="pt-8 sm:pt-10 mt-10 sm:mt-12 border-t border-[#EAD7CF]">
            <div className="text-center sm:text-left mb-6">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#981B24] mb-1">
                Direct Assistance
              </p>
              <h3 className="text-base sm:text-lg font-bold text-[#102B46]">Camp Coordinators</h3>
              <p className="text-xs sm:text-sm text-[#68717D]">
                For urgent on-ground camp queries, feel free to call our coordinators directly.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coordinators.length > 0 ? (
                coordinators.map((c) => (
                  <div
                    key={c.id || c.name || c.full_name}
                    className="bg-white rounded-xl border border-[#F3DEDA] p-4 text-center sm:text-left flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#102B46]">{c.full_name || c.name}</p>
                      {(c.role_label || c.role) ? (
                        <p className="text-xs font-semibold text-[#981B24] mb-3">{c.role_label || c.role}</p>
                      ) : null}
                    </div>
                    <a
                      href={`tel:${(c.phone || '').replace(/\s/g, '')}`}
                      className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#102B46] bg-[#FAF4EC] border border-[#EAD7CF] hover:border-[#981B24]/40 hover:text-[#981B24] transition w-full sm:w-auto"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#981B24]" aria-hidden="true" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-3 p-5 bg-white/70 border border-[#F3DEDA] rounded-xl text-xs text-[#68717D] text-center sm:text-left">
                  Camp coordinator direct hotline numbers will be active on camp day. For all inquiries before the camp, please use the message form above or email us at {settings?.contact_email || 'bdc@skit.ac.in'}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campus Map Section */}
        <section className="pb-16 sm:pb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#981B24] mb-1">
                Campus Location
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102B46]">
                SKIT Jaipur Campus
              </h2>
              <p className="text-xs sm:text-sm text-[#68717D] mt-1 max-w-2xl">
                Swami Keshvanand Institute of Technology, Management &amp; Gramothan (SKIT),
                Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017
              </p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Swami+Keshvanand+Institute+of+Technology,+Management+%26+Gramothan+(SKIT),+Ramnagaria,+Jagatpura,+Jaipur,+Rajasthan+302017"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#981B24] hover:text-[#7E141C] transition-colors shrink-0 group self-start sm:self-auto py-1"
            >
              <span>Open in Maps</span>
              <ExternalLink
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="w-full rounded-2xl overflow-hidden border border-[#EAD7CF] shadow-xs bg-[#FAF4EB] relative h-[320px] sm:h-[400px] lg:h-[450px]">
            <iframe
              title="SKIT Jaipur Campus Location Map"
              src="https://maps.google.com/maps?q=Swami+Keshvanand+Institute+of+Technology,+Ramnagaria,+Jagatpura,+Jaipur,+Rajasthan+302017&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
