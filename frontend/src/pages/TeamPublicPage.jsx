import React, { useState, useEffect } from 'react';
import HeroWave from '../components/common/HeroWave.jsx';
import { usePublicTeam } from '../hooks/usePublicData.js';
import { api } from '../services/api.js';

// Neutral inline-SVG avatar, shared across every camp as the fallback when
// no photo has been uploaded for a person yet.
const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#F3DEDA"/>
      <circle cx="100" cy="78" r="34" fill="#EAD7D0"/>
      <path d="M40 168c8-38 40-56 60-56s52 18 60 56" fill="#EAD7D0"/>
    </svg>`
  );

const SECTION_LAYOUT_CONFIG = {
  chiefCoordinator: { preferredColumns: 3 },
  members: { preferredColumns: 5 },
  studentCoordinators: { preferredColumns: 5 },
  websiteTeam: { preferredColumns: 5 }
};

const COLUMN_CONFIGS = {
  1: { card: 'w-full' },
  2: { card: 'w-[calc(50%-0.75rem)] sm:w-[calc(50%-1rem)]' },
  3: { card: 'w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.34rem)]' },
  4: { card: 'w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.34rem)] md:w-[calc(25%-1.5rem)]' },
  5: { card: 'w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.34rem)] md:w-[calc(25%-1.5rem)] lg:w-[calc(20%-1.6rem)]' },
  6: { card: 'w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.34rem)] md:w-[calc(25%-1.5rem)] lg:w-[calc(20%-1.6rem)] xl:w-[calc(16.666%-1.67rem)]' }
};

function getSafeColumns(value, defaultValue = 5) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 6) return defaultValue;
  return num;
}

function PersonProfile({ person, isChief = false }) {
  const { name, role, photoUrl } = person;

  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="shrink-0 mb-3 sm:mb-3.5">
        <img
          src={photoUrl || FALLBACK_AVATAR}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`rounded-full object-cover border-2 border-[#981B24]/30 shadow-sm transition-opacity duration-300 ${
            isChief
              ? 'w-36 h-36 sm:w-40 sm:h-40 lg:w-[164px] lg:h-[164px]'
              : 'w-28 h-28 sm:w-32 sm:h-32 lg:w-[138px] lg:h-[138px]'
          }`}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_AVATAR;
          }}
        />
      </div>
      <h3
        className={`font-bold text-[#102B46] tracking-tight leading-snug px-1 max-w-[200px] break-words ${
          isChief
            ? `text-base sm:text-lg lg:text-xl ${role?.trim() ? 'mb-1' : ''}`
            : `text-sm sm:text-base ${role?.trim() ? 'mb-1' : ''}`
        }`}
      >
        {name}
      </h3>
      {role && role.trim() ? (
        <p
          className={`font-semibold text-[#981B24] tracking-normal px-1 max-w-[200px] break-words ${
            isChief
              ? 'text-xs sm:text-sm'
              : 'text-xs sm:text-[13px]'
          }`}
        >
          {role}
        </p>
      ) : null}
      {person.phone && <a className="mt-2 text-sm text-[#981B24]" href={`tel:${person.phone}`}>{person.phone}</a>}
    </div>
  );
}

function TeamGroupGrid({ people = [], preferredColumns = 5, isChief = false }) {
  if (!people || people.length === 0) return null;

  const safeCols = getSafeColumns(preferredColumns, isChief ? 3 : 5);
  const config = COLUMN_CONFIGS[safeCols] || COLUMN_CONFIGS[5];

  return (
    <div className="flex flex-wrap justify-center items-start gap-x-6 sm:gap-x-8 xl:gap-x-10 gap-y-10 sm:gap-y-12 w-full mx-auto">
      {people.map((person, idx) => (
        <div
          key={`${person.name}-${person.role}-${idx}`}
          className={`flex justify-center shrink-0 ${config.card}`}
        >
          <PersonProfile person={person} isChief={isChief} />
        </div>
      ))}
    </div>
  );
}

export default function TeamPublicPage() {
  const { data, isLoading } = usePublicTeam();
  const [cmsPages, setCmsPages] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.content.getPages().then(res => {
      if (mounted && res?.success && res.data) {
        setCmsPages(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const chiefCoordinators = Array.isArray(data?.chiefCoordinators) ? data.chiefCoordinators : [];
  const members = Array.isArray(data?.members) ? data.members : [];
  const studentCoordinators = Array.isArray(data?.studentCoordinators) ? data.studentCoordinators : [];
  const websiteTeam = Array.isArray(data?.websiteTeam) ? data.websiteTeam : [];

  const totalMembers = chiefCoordinators.length + members.length + studentCoordinators.length + websiteTeam.length;

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#981B24] text-white">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] pt-16 pb-24 lg:pb-28 animate-fade-in-up">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#F3DEDA] mb-3">
            {cmsPages?.team?.eyebrow || 'ORGANIZING TEAM'}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {cmsPages?.team?.title || 'Our Team'}
          </h1>
          <p className="text-[#F3DEDA] max-w-xl text-sm sm:text-base leading-relaxed">
            {cmsPages?.team?.description || 'A group of dedicated students working together to build a healthier, stronger community through voluntary blood donation.'}
          </p>
        </div>
        <HeroWave fill="#FFFDF9" />
      </section>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:pl-[8%] lg:pr-[6%] py-8">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading team roster...
          </div>
        ) : totalMembers > 0 ? (
          <>
            {/* Chief Coordinator */}
            {chiefCoordinators.length > 0 && (
              <section className="py-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#102B46] mb-2">Chief Coordinator</h2>
                <p className="text-sm text-[#68717D] mb-10 max-w-xl mx-auto">
                  Lead. Organise. Inspire. Driving the vision of BDC with dedication and compassion.
                </p>
                <TeamGroupGrid
                  people={chiefCoordinators}
                  preferredColumns={SECTION_LAYOUT_CONFIG.chiefCoordinator.preferredColumns}
                  isChief={true}
                />
              </section>
            )}

            {/* Members */}
            {members.length > 0 && (
              <section className="py-12 px-6 sm:px-8 lg:px-10 bg-[#FDF3EF] rounded-3xl my-8">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#102B46] mb-2">Members</h2>
                  <p className="text-sm text-[#68717D] max-w-xl mx-auto">
                    The core team working behind the scenes to make every camp a success.
                  </p>
                </div>
                <TeamGroupGrid
                  people={members}
                  preferredColumns={SECTION_LAYOUT_CONFIG.members.preferredColumns}
                />
              </section>
            )}

            {/* Student Coordinators */}
            {studentCoordinators.length > 0 && (
              <section className="py-12">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#102B46] mb-2">Student Coordinators</h2>
                  <p className="text-sm text-[#68717D] max-w-xl mx-auto">
                    Student leaders who help in organising, coordinating and managing the ground activities.
                  </p>
                </div>
                <TeamGroupGrid
                  people={studentCoordinators}
                  preferredColumns={SECTION_LAYOUT_CONFIG.studentCoordinators.preferredColumns}
                />
              </section>
            )}

            {/* Website Team */}
            {websiteTeam.length > 0 && (
              <section className="py-12 pb-16">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#102B46] mb-2">Website Team</h2>
                  <p className="text-sm text-[#68717D] max-w-xl mx-auto">
                    The creative minds behind our digital presence, keeping BDC connected with everyone.
                  </p>
                </div>
                <TeamGroupGrid
                  people={websiteTeam}
                  preferredColumns={SECTION_LAYOUT_CONFIG.websiteTeam.preferredColumns}
                />
              </section>
            )}
          </>
        ) : (
          <div className="py-20 text-center bg-[#FAF4EB] border border-[#F3DEDA] rounded-2xl p-8 max-w-xl mx-auto my-8">
            <h3 className="text-base font-bold text-[#102B46] mb-1">No Team Members Listed</h3>
            <p className="text-xs text-slate-500">
              {cmsPages?.team?.emptyMessage || 'There is currently no team roster published for this campaign.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
