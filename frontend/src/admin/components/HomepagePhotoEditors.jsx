import React from 'react';
import { ImagePickerField } from './ImagePickerModal.jsx';

const field = 'w-full p-2 rounded-lg border border-slate-300 text-sm';
const button = 'px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-40';

function OrderControls({ index, items, onChange, label }) {
  const move = step => {
    const next = [...items];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  };
  return <div className="flex flex-wrap gap-2">
    <button type="button" className={button} disabled={index === 0} aria-label={`Move ${label} up`} onClick={() => move(-1)}>Move up</button>
    <button type="button" className={button} disabled={index === items.length - 1} aria-label={`Move ${label} down`} onClick={() => move(1)}>Move down</button>
    <button type="button" className={button} onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove {label}</button>
  </div>;
}

export function HeroPhotosEditor({ slides = [], onChange }) {
  const update = (index, values) => onChange(slides.map((slide, i) => i === index ? { ...slide, ...values } : slide));
  return <div className="space-y-4">
    <h4 className="font-semibold">Hero carousel photos</h4>
    <p className="text-xs text-slate-500">Photos appear in this order. Original proportions are preserved on desktop and mobile.</p>
    {slides.map((slide, index) => <div key={slide.id || index} className="p-4 border rounded-xl space-y-3">
      <ImagePickerField label={`Hero photo ${index + 1}`} value={slide.imageUrl ?? slide.image_url ?? ''}
        kind="HERO" defaultOriginal allowRemove onChange={(url, assetId) => update(index, { imageUrl: url, image_url: url, asset_id: assetId })} />
      <label className="block text-xs">Image description
        <input className={field} value={slide.alt || ''} onChange={event => update(index, { alt: event.target.value })} />
      </label>
      <OrderControls index={index} items={slides} label={`photo ${index + 1}`} onChange={onChange} />
    </div>)}
    <button type="button" className={button} onClick={() => onChange([...slides, { id: crypto.randomUUID(), imageUrl: '', image_url: '', alt: '' }])}>Add photo</button>
  </div>;
}

export function LeadershipEditor({ value, onChange }) {
  const data = { enabled: true, eyebrow: 'Our Strength', heading: 'The Leadership Behind Our Success', cards: [], ...value };
  const update = values => onChange({ ...data, ...values });
  const updateCard = (index, values) => update({ cards: data.cards.map((card, i) => i === index ? { ...card, ...values } : card) });
  return <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
    <h3 className="font-bold text-slate-900">Leadership — between Gallery and Our Team</h3>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={data.enabled} onChange={event => update({ enabled: event.target.checked })} />Show section when cards are available</label>
    <label className="block text-sm">Small title<input className={field} value={data.eyebrow} onChange={event => update({ eyebrow: event.target.value })} /></label>
    <label className="block text-sm">Heading<input className={field} value={data.heading} onChange={event => update({ heading: event.target.value })} /></label>
    {data.cards.map((card, index) => <div key={card.id || index} className="p-4 border rounded-xl space-y-3">
      <ImagePickerField label={`Leadership portrait ${index + 1}`} value={card.imageUrl || ''} defaultOriginal allowRemove
        onChange={(url, assetId) => updateCard(index, { imageUrl: url, assetId })} />
      {[['name', 'Name or title'], ['role', 'Role / designation']].map(([key, label]) => <label key={key} className="block text-sm">{label}
        <input className={field} value={card[key] || ''} onChange={event => updateCard(index, { [key]: event.target.value })} />
      </label>)}
      <label className="block text-sm">Short description<textarea rows={3} className={field} value={card.description || ''} onChange={event => updateCard(index, { description: event.target.value })} /></label>
      <OrderControls index={index} items={data.cards} label={`card ${index + 1}`} onChange={cards => update({ cards })} />
    </div>)}
    <button type="button" className={button} onClick={() => update({ cards: [...data.cards, { id: crypto.randomUUID(), imageUrl: '', name: '', role: '', description: '' }] })}>Add leadership card</button>
    <p className="text-xs text-slate-500">Use the existing Save Draft and Publish controls to save these changes. Removing a card or image does not delete its uploaded file.</p>
  </section>;
}
