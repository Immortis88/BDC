import React from 'react';
import { getDonationProcessContent } from '../../data/donationProcess.js';

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal';

export default function DonationProcessTextEditor({ value, onChange }) {
  const content = getDonationProcessContent(value);
  const update = (key, text) => onChange({ ...content, [key]: text });
  const updateStep = (index, key, text) => onChange({ ...content, steps: content.steps.map((step, i) => i === index ? { ...step, [key]: text } : step) });
  return <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5" aria-labelledby="process-editor-title">
    <div>
      <h3 id="process-editor-title" className="text-base font-bold text-slate-900">Donation Process — Text</h3>
      <p className="text-xs text-slate-500 mt-1">Edit the section between the three navigation cards and FAQ questions. Illustrations stay fixed. Use Save Draft, Preview and Publish above.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        ['eyebrow', 'Small heading'], ['heading', 'Main heading'],
        ['highlightedHeading', 'Highlighted heading (red)'], ['subtitle', 'Subtitle'],
      ].map(([key, label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}
        <input className={inputClass} value={content[key]} onChange={event => update(key, event.target.value)} />
      </label>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {content.steps.map((step, index) => <fieldset key={index} className="border border-slate-200 rounded-xl p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold text-slate-700">Step {index + 1}</legend>
        <label className="block text-sm font-medium text-slate-700">Badge text
          <input className={inputClass} maxLength={3} value={step.badge} onChange={event => updateStep(index, 'badge', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Image title
          <input className={inputClass} value={step.title} onChange={event => updateStep(index, 'title', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Description
          <textarea className={inputClass} rows={4} value={step.description} onChange={event => updateStep(index, 'description', event.target.value)} />
        </label>
      </fieldset>)}
    </div>
  </section>;
}
