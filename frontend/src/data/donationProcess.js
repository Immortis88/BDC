export const PROCESS_IMAGES = ['donation', 'testing', 'separation', 'components', 'helping-patients', 'new-beginnings'];

export const DEFAULT_DONATION_PROCESS = {
  eyebrow: 'The Process',
  heading: 'From Your Donation to a',
  highlightedHeading: 'New Beginning',
  subtitle: 'A simple process. A powerful impact.',
  steps: [
    { badge: '1', title: 'Donation', description: 'Your journey begins with a health check and a blood donation, supported by trained staff.' },
    { badge: '2', title: 'Testing', description: 'The collected blood is tested for blood group and screened for infections before it can be used.' },
    { badge: '3', title: 'Separation', description: 'Blood is processed to separate it into components, including red blood cells, plasma and platelets.' },
    { badge: '4', title: 'Components', description: 'Each component has a different purpose and is stored under the conditions it needs.' },
    { badge: '5', title: 'Helping Patients', description: 'These components support patients receiving cancer treatment, recovering from injuries, undergoing surgery and more.' },
    { badge: '6', title: 'New Beginnings', description: 'Your donation can help more than one patient and give people another chance at a healthier tomorrow.' },
  ],
};

// Only text is configurable. Missing legacy fields use defaults; deliberate blanks stay blank.
export function getDonationProcessContent(value) {
  const text = (candidate, fallback) => typeof candidate === 'string' ? candidate : fallback;
  return {
    ...Object.fromEntries(['eyebrow', 'heading', 'highlightedHeading', 'subtitle'].map(key => [key, text(value?.[key], DEFAULT_DONATION_PROCESS[key])])),
    steps: DEFAULT_DONATION_PROCESS.steps.map((step, index) => Object.fromEntries(
      ['badge', 'title', 'description'].map(key => [key, text(value?.steps?.[index]?.[key], step[key])])
    )),
  };
}
