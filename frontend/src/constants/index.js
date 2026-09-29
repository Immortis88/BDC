/**
 * SKIT Blood Donation Campaign (BDC) — Public Website Constants
 * Self-contained independent UI constants for public pages.
 */

export const TRACKING_START_YEAR = 2026;

// Role choices for registration
export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  STAFF_MEMBER: 'STAFF_MEMBER',
  OUTSIDE_SKIT: 'OUTSIDE_SKIT'
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.STUDENT]: 'Student',
  [ROLES.STAFF_MEMBER]: 'Staff Member',
  [ROLES.OUTSIDE_SKIT]: 'Outside SKIT'
});

// Branches (for students and staff)
export const BRANCHES = Object.freeze([
  'Artificial Intelligence',
  'Civil',
  'Computer Science',
  'Data Science',
  'Electronics and Communication',
  'Electrical',
  'Information Technology',
  'Internet of Things',
  'Mechanical',
  'MBA',
  'Pharmacy'
]);

// Blood groups: 8 standard ABO/Rh + UNKNOWN
export const BLOOD_GROUPS = Object.freeze([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'UNKNOWN'
]);

// Camp status
export const CAMP_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
});

export const COORDINATOR_GROUPS = Object.freeze([
  'Chief Coordinator',
  'Members',
  'Student Coordinators'
]);

export const TEAM_CATEGORIES = Object.freeze([
  'Chief Coordinator',
  'Members',
  'Student Coordinators',
  'Website Team',
  'Volunteers'
]);

export const HOMEPAGE_SECTION_KEYS = Object.freeze([
  'featured_camp',
  'supporters',
  'inspiration',
  'impact',
  'gallery'
]);

export const DEFAULT_HOMEPAGE_CONTENT = Object.freeze({
  hero: Object.freeze({
    eyebrow: 'SKIT JAIPUR · BLOOD DONATION CAMPAIGN',
    headline: 'Donate Blood. Carry Hope.',
    description: 'Join the SKIT community in coming together for blood donation.',
    primary_cta_label: 'Register',
    secondary_cta_label: 'Explore our journey',
    secondary_cta_url: '/about',
    image_url: '/assets/A01-home-hero-donor-v2.webp',
    image_alt: 'Student donating blood at SKIT Blood Donation Camp',
    images: Object.freeze([])
  }),
  inspiration: Object.freeze({
    heading: 'Our inspiration',
    description: 'Inspired by Swami Keshvanand’s lifelong dedication to education, selfless service, and rural upliftment.',
    portrait_url: '/assets/swamiji-portrait.png',
    portrait_alt: 'Swami Keshvanand'
  }),
  sections_order: Object.freeze([
    'featured_camp',
    'supporters',
    'inspiration',
    'impact',
    'gallery'
  ]),
  sections_visibility: Object.freeze({
    featured_camp: true,
    supporters: true,
    inspiration: true,
    impact: true,
    gallery: true
  }),
  footer: Object.freeze({
    tagline: 'Annual blood donation initiative dedicated to saving lives and serving the community.'
  })
});
