import React from 'react';

/**
 * HeroWave
 * Reusable bottom wave divider for public page hero banners.
 * Uses the approved reference curve from /assets/bdc_team_wave_reference_v2.svg.
 *
 * @param {Object} props
 * @param {string} [props.fill='#FFFDF9'] - Fill color matching the following section's background.
 * @param {string} [props.className] - Additional wrapper class names.
 */
export default function HeroWave({ fill = '#FFFDF9', className = '' }) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none select-none z-10 ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-11 md:h-14 lg:h-16 xl:h-20 block translate-y-[1px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={fill}
          d="M0 42 C135 30 255 22 385 24 C535 26 620 43 750 51 C875 59 1000 60 1115 50 C1240 39 1340 20 1440 4 L1440 80 L0 80 Z"
        />
      </svg>
    </div>
  );
}
