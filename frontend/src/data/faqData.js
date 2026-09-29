/**
 * SKIT Blood Donation Campaign (BDC) — Shared FAQ Data Source
 *
 * Single source of truth for both the Homepage FAQ section and the Full FAQ Page (/faq).
 * Structured to support seamless migration to a MERN /api/faqs endpoint in the future.
 */

export const FAQ_DATA = [
  // ── General Questions ──────────────────────────────────────────────────────────
  {
    id: 'faq-gen-1',
    question: 'What is the Blood Donation Camp (BDC)?',
    answer: 'The Blood Donation Campaign (BDC) is an annual student-driven social welfare initiative organized at Swami Keshvanand Institute of Technology, Management & Gramothan (SKIT), Jaipur. Over more than two decades, BDC has collected thousands of voluntary blood units to support regional healthcare institutions and emergency blood banks across Rajasthan.',
    category: 'general',
    order: 1,
    isActive: true,
    showOnHome: true
  },
  {
    id: 'faq-gen-2',
    question: 'Who can participate in the camp?',
    answer: 'All college students, faculty members, administrative staff, alumni, and outside community members aged 18 years or older who meet the basic medical eligibility criteria are welcome to participate. Both prospective blood donors and registered student volunteers can contribute to the camp.',
    category: 'general',
    order: 2,
    isActive: true,
    showOnHome: true
  },
  {
    id: 'faq-gen-3',
    question: 'When and where is the next BDC camp?',
    answer: 'The upcoming SKIT Blood Donation Drive 2026 is scheduled for 15 October 2026 (9:00 AM – 4:00 PM) at the Central Amphitheatre & Medical Block, SKIT Campus, Ramnagaria, Jagatpura, Jaipur. (TODO: Coordinator to confirm final camp timing if extended beyond 4:00 PM).',
    category: 'general',
    order: 3,
    isActive: true,
    showOnHome: true
  },
  {
    id: 'faq-gen-4',
    question: 'Is there any registration fee?',
    answer: 'No. Participation and donor registration in the BDC camp is completely free of charge. We encourage all voluntary donors to register online in advance or register as a walk-in at our registration desk on camp day.',
    category: 'general',
    order: 4,
    isActive: true,
    showOnHome: true
  },
  {
    id: 'faq-gen-5',
    question: 'What should I bring to the camp?',
    answer: 'Please bring a valid government-issued photo ID (such as your Aadhaar card, Driver\'s License, or Voter ID) and your SKIT Student/Staff ID card (if affiliated with the institution). It is strongly advised to be well-hydrated, have a light meal or breakfast beforehand, and wear comfortable clothing with sleeves that can easily be rolled up.',
    category: 'general',
    order: 5,
    isActive: true,
    showOnHome: true
  },
  {
    id: 'faq-gen-6',
    question: 'Will I receive a certificate?',
    answer: 'Yes! Every voluntary donor receives an official Donor Certificate of Appreciation along with a donor refreshment packet immediately following donation. (TODO: Coordinator to specify if digital certificates will also be available for download via student portal).',
    category: 'general',
    order: 6,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-gen-7',
    question: 'Who organizes the BDC camp?',
    answer: 'The camp is conceptualized and organized by the students and faculty coordinators of SKIT Jaipur, with continuous guidance from institutional leadership and professional medical partnerships with recognized government and NGO blood banks including SMS Hospital and Santokba Durlabhji Memorial Hospital. For inquiries, reach out at bdc@skit.ac.in or +91 141 3500300. (TODO: Coordinator to update campaign helpline extensions if needed).',
    category: 'general',
    order: 7,
    isActive: true,
    showOnHome: false
  },

  // ── Donation Questions ────────────────────────────────────────────────────────
  {
    id: 'faq-don-1',
    question: 'Who is eligible to donate blood?',
    answer: 'Donors should be between 18 and 65 years of age, weigh at least 45–50 kg, have a hemoglobin level of 12.5 g/dL or above, and normal pulse and blood pressure. You should feel generally healthy and well on the day of donation. Final eligibility is always determined on-site by authorized medical screening doctors.',
    category: 'donation',
    order: 8,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-2',
    question: 'Is blood donation safe?',
    answer: 'Absolutely. Blood donation is a safe, medically supervised procedure. All needles, tubing, and blood collection bags are sterile, pre-packaged, and used only once before being safely disposed of. There is zero risk of contracting any transmissible disease by donating blood.',
    category: 'donation',
    order: 9,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-3',
    question: 'How much time does the donation process take?',
    answer: 'The actual blood draw typically takes only 8 to 12 minutes. The entire process—including registration, basic health vitals screening (hemoglobin, blood pressure, weight), donation, and post-donation refreshments and rest—takes approximately 30 to 45 minutes in total.',
    category: 'donation',
    order: 10,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-4',
    question: 'Can I donate if I have a medical condition?',
    answer: 'Certain conditions (like recent major surgery, active infections, heart ailments, or taking specific prescription medications) may require a temporary or permanent deferral. Chronic conditions like hypertension or thyroid disorders may be acceptable if well-managed. Please discuss your medical history openly with our medical team during the pre-donation confidential screening on camp day.',
    category: 'donation',
    order: 11,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-5',
    question: 'How often can I donate blood?',
    answer: 'Healthy male donors can donate whole blood every 3 months (90 days), while healthy female donors can donate every 4 months (120 days). Your body naturally replenishes the lost fluid volume within 24 to 48 hours, and red blood cells are regenerated over several weeks.',
    category: 'donation',
    order: 12,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-6',
    question: 'Will I be tested for any diseases?',
    answer: 'Yes. Prior to donation, your hemoglobin level is tested instantly. After collection, every unit of donated blood undergoes mandatory confidential screening by partnering government blood banks for transfusion-transmissible infections including HIV, Hepatitis B and C, Syphilis, and Malaria before being cleared for patient use.',
    category: 'donation',
    order: 13,
    isActive: true,
    showOnHome: false
  },
  {
    id: 'faq-don-7',
    question: 'What happens after I donate blood?',
    answer: 'After donating, you will be escorted to our observation and refreshment area to relax for 10–15 minutes, enjoy juice and snacks, and receive your donor certificate. We recommend drinking plenty of fluids, avoiding strenuous physical exercise or heavy lifting for the rest of the day, and keeping the bandage on your arm for a few hours.',
    category: 'donation',
    order: 14,
    isActive: true,
    showOnHome: false
  }
];

/**
 * Filter FAQs by category and active status, ordered by order field.
 */
export function getFaqsByCategory(category) {
  return FAQ_DATA
    .filter(item => item.isActive && item.category === category)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get the homepage FAQ list (items flagged showOnHome, limited to 5, sorted by order).
 */
export function getHomeFaqs(limit = 5) {
  const homeFaqs = FAQ_DATA
    .filter(item => item.isActive && item.showOnHome)
    .sort((a, b) => a.order - b.order);

  if (homeFaqs.length >= limit) {
    return homeFaqs.slice(0, limit);
  }
  // Fallback to first 5 general items if flag isn't set on 5
  return FAQ_DATA
    .filter(item => item.isActive && item.category === 'general')
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}
