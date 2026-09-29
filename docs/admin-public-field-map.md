# SKIT Blood Donation Campaign (BDC) — Public-to-Admin Content & Field Mapping

This document provides the authoritative mapping between the fixed public website UI and the admin portal controls in `C:\Users\bhara\Downloads\BDC`.

The public website UI is the highest-priority reference. All admin fields, temporary mock datasets, and form controls are organized to match the public website's displayed content, structure, and assets.

---

## 1. Global Website Content (Website CMS & Global Settings)

All entries in this section are managed globally under **Website CMS** (`/admin/website`). They remain global when switching camps.

### 1.1 Homepage Hero Section
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` | Hero Banner | `SKIT JAIPUR · BLOOD DONATION CAMPAIGN` | `hero.eyebrow` | Text (`input[type="text"]`) | Global Website CMS | Existing (needs initial value match) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | `Donate blood.\nCarry hope.` | `hero.headline` | Multi-line Text (`textarea` or two inputs) | Global Website CMS | Existing (needs initial value match) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | `A small act from you can give someone a second chance at life.` | `hero.description` | Textarea | Global Website CMS | Existing (needs initial value match) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | `Register Now` (fallback: `Registration Closed`) | `hero.primary_cta_label` | Text | Global Website CMS | Missing in form (was hardcoded) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | `Our Journey` | `hero.secondary_cta_label` | Text | Global Website CMS | Missing in form (was hardcoded) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | `/about` | `hero.secondary_cta_url` | Text / URL | Global Website CMS | Missing in form (was hardcoded) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Hero Banner | Image: `/assets/A01-home-hero-donor-v2.webp`<br>Focal: `right 20%`<br>Alt: `Student donating blood at SKIT Blood Donation Camp` | `hero.slides` | Image List with URL, focal position & alt | Global Website CMS | Existing (was populated with Unsplash mock URLs) | `mockAdminService.cms.getArea('HOMEPAGE')` & `heroSlides.js` | `<HomePage />` |

---

### 1.2 Homepage About BDC (Section 3)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` | About BDC | `ABOUT BDC` | `about.eyebrow` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | About BDC | `A student initiative for a healthier tomorrow.` | `about.headline` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | About BDC | `The Blood Donation Campaign (BDC) at SKIT is a student-driven initiative to create awareness about voluntary blood donation and to contribute towards a healthier, stronger community.` | `about.description` | Textarea | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | About BDC | `Discover BDC` | `about.cta_label` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | About BDC | `/about` | `about.cta_url` | Text / URL | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | About BDC | Landscape Photo (5:3 aspect ratio placeholder or uploaded image) | `about.image_url` | Image URL / File input | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |

---

### 1.3 Our Impact Statistics (Homepage Section 4 & AboutPage Section 5)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx`, `AboutPage.jsx` | Our Impact | `1,200+` (Units collected) | `impact.blood_units` | Integer (`input[type="number"]`) | Global Website CMS | Missing in admin UI (was hardcoded in baseline) | `mockAdminService.cms.getArea('HOMEPAGE')` & `impactService.js` | `<ImpactStatItem />`, `<AboutImpactStatItem />` |
| `HomePage.jsx`, `AboutPage.jsx` | Our Impact | `2,500+` (Voluntary donors) | `impact.donors` | Integer (`input[type="number"]`) | Global Website CMS | Missing in admin UI | `mockAdminService.cms.getArea('HOMEPAGE')` & `impactService.js` | `<ImpactStatItem />`, `<AboutImpactStatItem />` |
| `HomePage.jsx`, `AboutPage.jsx` | Our Impact | `24+` (Camps organised) | `impact.camps_organised` | Integer (`input[type="number"]`) | Global Website CMS | Missing in admin UI | `mockAdminService.cms.getArea('HOMEPAGE')` & `impactService.js` | `<ImpactStatItem />`, `<AboutImpactStatItem />` |
| `HomePage.jsx`, `AboutPage.jsx` | Our Impact | `/assets/bdc_impact_slightly_bright_webp.webp` | `impact.banner_url` | Image URL | Global Website CMS | Missing in admin UI | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />`, `<AboutPage />` |

---

### 1.4 Our Inspiration Tribute (Homepage Section 8)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` | Our Inspiration | `Our Inspiration` | `inspiration.section_label` | Text | Global Website CMS | Existing (`inspiration_heading`) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `Swami Keshvanand` | `inspiration.name` | Text | Global Website CMS | Missing (was combined in heading) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `A legacy of education, selfless service and community upliftment.` | `inspiration.description` | Textarea | Global Website CMS | Existing (`inspiration_narrative`) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `Values for a Better Tomorrow.` | `inspiration.closing_statement` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `['Education', 'Service', 'Society', 'Self Reliance']` | `inspiration.slogans_left` | Tag/List input or comma-separated | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `['Individual', 'Development', 'Leads To', 'A Stronger', 'Nation']` | `inspiration.slogans_right` | Tag/List input or comma-separated | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Our Inspiration | `/assets/inspiration_swamiji.png`<br>`/assets/inspiration_arch.png`<br>`/assets/inspiration_tree.png` | Fixed botanical/arch assets with Swamiji portrait | Image preview / file | Global Website CMS | Fixed decorative SVG/PNG with verified Swamiji portrait | `HomePage.jsx` | `<HomePage />` |

---

### 1.5 Final Registration CTA Band (Homepage Section 10)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` | Final CTA Band | `BE A LIFESAVER` | `cta_band.eyebrow` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Final CTA Band | `Your one small act.` | `cta_band.headline_1` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Final CTA Band | `Someone’s tomorrow.` | `cta_band.headline_2` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |
| `HomePage.jsx` | Final CTA Band | `Register Now` | `cta_band.button_label` | Text | Global Website CMS | Missing in admin form | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |

---

### 1.6 Global Homepage Section Ordering & Visibility
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` | Section order & visibility | 1. Hero<br>2. Featured Camp<br>3. About BDC<br>4. Our Impact<br>5. Gallery Preview<br>6. Team Preview<br>7. Partners Logo Strip<br>8. Our Inspiration<br>9. FAQ Preview<br>10. Final CTA Band | `sections` array with `{ key, label, visible, order }` | Toggle switches + Up/Down reorder controls | Global Website CMS | Partially existing (needed full list of 10 sections) | `mockAdminService.cms.getArea('HOMEPAGE')` | `<HomePage />` |

---

### 1.7 Global Notices & Announcements
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Global ticker / banner | Public notice banner | Text, link URL, active status | `notices` array | Text input, link input, toggle | Global Website CMS | Existing in `WebsiteAdminPage.jsx` | `mockAdminService.cms.getArea('NOTICES')` | Public layout / pages |

---

### 1.8 Frequently Asked Questions (FAQ)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomeFaqSection.jsx`, `FaqPage.jsx` | FAQ list | 14 curated questions across `general` and `donation` categories | `faq.items` (`question`, `answer`, `category`, `order`, `isActive`, `showOnHome`) | Question text, answer textarea, category dropdown, active toggle, homepage toggle | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` (now added) | `mockAdminService.cms.getArea('FAQ')` & `src/data/faqData.js` | `<HomeFaqSection />`, `<FaqPage />` |

---

### 1.9 Contact Information & Footer
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ContactPage.jsx`, `Footer.jsx` | Contact details | `+91 141 350 0000` / `+91 141 3500300` | `contact.phone` | Phone (`input[type="tel"]`) | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` (now added) | `mockAdminService.cms.getArea('CONTACT')` & `mockData.js` | `<ContactPage />`, `<Footer />` |
| `ContactPage.jsx`, `Footer.jsx` | Contact details | `bdc@skit.ac.in` | `contact.email` | Email (`input[type="email"]`) | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` | `mockAdminService.cms.getArea('CONTACT')` & `mockData.js` | `<ContactPage />`, `<Footer />` |
| `ContactPage.jsx`, `Footer.jsx` | Contact details | `Swami Keshvanand Institute of Technology, Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017` | `contact.campus_address` | Textarea | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` | `mockAdminService.cms.getArea('CONTACT')` & `mockData.js` | `<ContactPage />`, `<Footer />` |
| `Footer.jsx` | Footer | `A student initiative for a healthier, stronger tomorrow.` | `contact.footer_tagline` | Text | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` | `mockAdminService.cms.getArea('CONTACT')` & `mockData.js` | `<Footer />` |
| `Footer.jsx` | Footer social icons | Facebook, Instagram, LinkedIn, YouTube URLs | `contact.social_links` | Array of URL inputs | Global Website CMS | Missing dedicated tab in `WebsiteAdminPage.jsx` | `mockAdminService.cms.getArea('CONTACT')` | `<Footer />` |

---

## 2. Camp-Specific Administration Content

Managed inside each dedicated camp workspace (`/admin/camps/:campId/...`).

### 2.1 Camp Metadata & Overview (`CampOverviewPage.jsx`, `/admin/camp`)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HomePage.jsx` (Current Camp card), `RegisterPage.jsx` | Camp Title | `SKIT Blood Donation Drive 2026` | `public_title` | Text | Camp-specific | Existing (needed initial title alignment) | `mockAdminService.camps.getById()` | `<HomePage />`, `<RegisterPage />` |
| Admin Camp Cards | Camp Internal Name | `BDC 2026` | `internal_name` | Text | Camp-specific (Internal) | Existing | `mockAdminService.camps.getById()` | Admin UI cards |
| `HomePage.jsx`, `RegisterPage.jsx` | Camp Date | `15 October 2026` (`2026-10-15`) | `camp_date` | Date (`input[type="date"]`) | Camp-specific | Existing | `mockAdminService.camps.getById()` | `<HomePage />`, `<RegisterPage />` |
| `HomePage.jsx` | Camp Timing | `9:00 AM – 4:00 PM` | `camp_time` / `starts_at` & `ends_at` | Text / Time | Camp-specific | Existing | `mockAdminService.camps.getById()` | `<HomePage />` |
| `HomePage.jsx`, `RegisterPage.jsx` | Camp Venue | `Central Amphitheatre & Medical Block, SKIT Campus, Jaipur` | `venue` | Text | Camp-specific | Existing | `mockAdminService.camps.getById()` | `<HomePage />`, `<RegisterPage />` |
| `HomePage.jsx`, `RegisterPage.jsx` | Camp Venue Subtitle | `Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017` | `venue_subtitle` / `venue_sub` | Text | Camp-specific | Existing | `mockAdminService.camps.getById()` | `<HomePage />`, `<RegisterPage />` |
| `HomePage.jsx`, `RegisterPage.jsx` | Registration Status | `Registration Open` (`true`) | `registration_open` | Switch / Toggle | Camp-specific | Existing | `mockAdminService.camps.getById()` | `<HomePage />`, `<RegisterPage />`, `<Navbar />` |
| Public Website Header & Live Pointer | Live Camp Indicator | Only 1 Camp Live at a time | `live_camp_id` | Super Admin live switch | System Global Pointer | Existing | `AdminAuthContext` & `mockAdminService.camps.setLive()` | Global public routing & hook |

---

### 2.2 Camp Team Roster (`CampTeamPage.jsx`, `TeamPublicPage.jsx`)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TeamPublicPage.jsx` | Chief Coordinator | Name: `Aarav Sharma`<br>Role: `Chief Coordinator`<br>Photo: `FALLBACK_AVATAR` | `CHIEF_COORDINATOR` group record | Text inputs + Photo file/URL + public phone toggle | Camp-specific | Existing in form, but needed group and data alignment with public site | `mockAdminService.team.getByCamp()` | `<TeamPublicPage />`, `<HomePage />` |
| `TeamPublicPage.jsx` | Members Section | 10 members: `Rohan Gupta`, `Priya Mehta`, `Karan Verma`, `Ananya Singh`, `Aditya Jain`, `Neha Sharma`, `Vikram Yadav`, `Sneha Agrawal`, `Harshit Bansal`, `Kritika Soni` | `MEMBERS` group records | Member modal with name, role, phone, avatar | Camp-specific | Existing in form, now initialized with real public roster | `mockAdminService.team.getByCamp()` | `<TeamPublicPage />`, `<HomePage />` |
| `TeamPublicPage.jsx` | Student Coordinators | 5 coordinators: `Aarav Sharma`, `Priya Mehta`, `Rohan Gupta`, `Ananya Singh`, `Karan Verma` | `STUDENT_COORDINATORS` group records | Member modal with name, role, phone, avatar | Camp-specific | Existing in form, now initialized with real public roster | `mockAdminService.team.getByCamp()` | `<TeamPublicPage />` |
| `TeamPublicPage.jsx` | Website Team | 5 members: `Devansh Sharma`, `Isha Gupta`, `Raghav Mehta`, `Simran Soni`, `Nikhil Jain` | `WEBSITE_TEAM` group records | Member modal with name, role, phone, avatar | Camp-specific | Missing in `CampTeamPage.jsx` (now added) | `mockAdminService.team.getByCamp()` | `<TeamPublicPage />` |

---

### 2.3 Camp Photo Gallery (`CampGalleryPage.jsx`, `GalleryPage.jsx`)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GalleryCarousel.jsx`, `GalleryPage.jsx` | Gallery Photos | 6 authentic verified assets:<br>1. `/assets/gallery/gallery_camp_donor_smile.webp`<br>2. `/assets/gallery/gallery_skit_banner_team.png`<br>3. `/assets/gallery/gallery_stress_ball.png`<br>4. `/assets/gallery/gallery_female_donor.png`<br>5. `/assets/gallery/gallery_donor_chair.png`<br>6. `/assets/gallery/gallery_hero_donor.webp` | `photos` array (`id`, `url`, `alt_text`, `caption`, `category`, `is_live`) | Upload file / URL, Alt text, Caption textarea, Category select, Visibility switch | Camp-specific | Existing, now connected to authentic assets and categorized tags | `mockAdminService.gallery.getByCamp()` | `<GalleryCarousel />`, `<GalleryPage />` |
| `GalleryPage.jsx` | Gallery Categories | `['All', 'Donors', 'Team', 'Setup', 'Awareness', 'Highlights']` | `category` | Dropdown Select | Camp-specific | Missing category assignment in admin modal (now added) | `mockAdminService.gallery.getByCamp()` | `<GalleryPage />` |

---

### 2.4 Camp Partners & Sponsors (`CampSponsorsPage.jsx`, `SupportersPage.jsx`)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SupportersPage.jsx` | Title Partner | `HDFC Bank` (Tagline: `We understand your world`, Logo: `/assets/partners/partner_hdfc.png`) | `title_partner` / Tier 1 | Text, Tagline, Logo URL | Camp-specific | Existing, now seeded with verified sponsor details | `mockAdminService.sponsors.getByCamp()` | `<SupportersPage />`, `<PartnersLogoStrip />` |
| `SupportersPage.jsx` | Main Sponsors | `Coca-Cola`, `SBI`, `Tata`, `Reliance Industries Limited` | Tier 2 `main_sponsors` | Name, Logo URL, Website URL | Camp-specific | Existing, now seeded with verified sponsor details | `mockAdminService.sponsors.getByCamp()` | `<SupportersPage />`, `<PartnersLogoStrip />` |
| `SupportersPage.jsx` | Supporting Sponsors | `Amul`, `Nestle`, `Decathlon`, `boAt`, `Red Bull`, `Zomato` | Tier 3 `supporting_sponsors` | Name, Logo URL, Website URL | Camp-specific | Existing, now seeded with verified sponsor details | `mockAdminService.sponsors.getByCamp()` | `<SupportersPage />` |
| `SupportersPage.jsx` | Community Partners | `Indian Red Cross Society`, `Fortis`, `Apollo Hospitals`, `Jaipur Police`, `NSS`, `Rotary International`, `SMS Hospital Jaipur`, `NIMS Jaipur` | Tier 4 `community_partners` | Name, Logo URL, Website URL | Camp-specific | Existing, now seeded with verified partner details | `mockAdminService.sponsors.getByCamp()` | `<SupportersPage />`, `<PartnersLogoStrip />` |
| `PartnersLogoStrip.jsx` | Homepage Marquee Logos | `SMS Hospital`, `Red Cross`, `NIMS`, `HDFC Bank`, `Coca-Cola`, `SBI` | `linked_to_homepage` flag | Checkbox / Toggle | Camp-specific | Existing (`linked` toggle) | `mockAdminService.sponsors.getByCamp()` | `<PartnersLogoStrip />` |

---

### 2.5 Donor Registrations (`CampRegistrationsPage.jsx`, `RegisterPage.jsx`)
| Public Component | Public Section | Current Displayed Value / Asset | Admin Field Name | Input Type | Ownership | Admin Control Status | Storage / Service Source | Consuming Public Component |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RegisterPage.jsx` | Registration Form | Full Name, Guardian Name, DOB, Blood Group, Role, Branch, College ID (for students), Mobile, Optional Address, Consent | Donor fields matching strict schema rules | Table, Detail modal, CSV export (NO Delete) | Camp-specific | Existing (Preserved, Aadhaar excluded, College ID required for students) | `mockAdminService.registrations.getByCamp()` | `<CampRegistrationsPage />` |

---

## 3. Summary of Controls Added, Renamed, and Obsoleted

### Controls Added:
1. **Homepage About BDC Card** in Website CMS:
   - Eyebrow, headline, description, button label, button target URL, landscape image.
2. **Homepage Final CTA Band Card** in Website CMS:
   - Eyebrow, headline line 1, headline line 2, button label.
3. **Dedicated FAQ Management Tab** in Website CMS:
   - Manage all 14 questions, category assignment (`general` vs `donation`), order, active toggle, homepage preview toggle.
4. **Dedicated Contact & Footer Settings Tab** in Website CMS:
   - Campus address, official phone, official email, footer tagline, social media links.
5. **Website Team Section** in `CampTeamPage.jsx`:
   - Group type `WEBSITE_TEAM` added to match `TeamPublicPage.jsx`.
6. **Gallery Category Tagging** in `CampGalleryPage.jsx`:
   - Category tags (`Donors`, `Team`, `Setup`, `Awareness`, `Highlights`) and caption field matching `GalleryPage.jsx`.
7. **Sponsor Tiers** in `CampSponsorsPage.jsx`:
   - Tiered categorization (`Title Partner`, `Main Sponsors`, `Supporting Sponsors`, `Community Partners`) with tagline support.
8. **Camp Operating Hours & Venue Subtitle** in `CampOverviewPage.jsx` and `CampsAdminPage.jsx`:
   - Editable Start Time (`starts_at`), End Time (`ends_at`), and Venue Subtitle (`venue_subtitle`) across overview and creation modals matching public camp banner presentation.

### Controls Renamed / Organized:
1. Renamed `Our Inspiration Tribute` fields in Website CMS to separate Section Label, Swami Keshvanand's Name, Description, and Closing Statement.
2. Renamed generic `IMG_xxxx` mock gallery items to authentic BDC photographs from the website.
3. Replaced dummy placeholder team members with the verified public team roster.
4. Replaced dummy sponsor names (`TEST`, `LION'S CLUB`) with verified partners and sponsors.

### Controls Removed / Obsoleted:
1. Removed all "Completed" or "Archived" badge toggles from camp cards.
2. Removed obsolete Unsplash image URLs from seeded mock data.
