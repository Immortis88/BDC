import React, { useId, useRef, useState, useEffect, useSyncExternalStore } from 'react';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { notifyCampUpdated } from '../../utils/campEvents.js';

let orderBusy = false;
const listeners = new Set();
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const setBusy = value => { orderBusy = value; listeners.forEach(fn => fn()); };

// Only the handle captures pointers. Nested lists and edit/delete buttons stay independent.
export default function SortableCards({ items, renderItem, onSave, onChange, disabled = false, className = '', label = 'cards' }) {
  const scope = useId();
  const globallySaving = useSyncExternalStore(subscribe, () => orderBusy);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const root = useRef(null);
  const busy = useRef(false);
  const handles = useRef(new Map());
  const gesture = useRef(null);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  async function move(from, to) {
    if (orderBusy || busy.current || disabled || from === to || !Number.isInteger(to) || to < 0 || to >= items.length) return;
    busy.current = true; setBusy(true); setSaving(true); setStatus('Saving order…');
    const previous = items;
    const next = [...items]; next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
    try {
      const result = await onSave(next.map(x => Number(x.id)), previous.map(x => Number(x.id)));
      if (!result.success) throw new Error(result.message || 'Could not save order.');
      if (mounted.current) setStatus('Order saved.'); notifyCampUpdated();
    } catch (error) {
      if (mounted.current) { onChange(previous); setStatus(`Order restored. ${error.message}`); }
    } finally { busy.current = false; setBusy(false); if (mounted.current) { setSaving(false); requestAnimationFrame(() => handles.current.get(items[from].id)?.focus()); } }
  }
  function point(event) {
    const bounds = root.current.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return null;
    const candidates = [...root.current.querySelectorAll('[data-order-scope]')].filter(el => el.dataset.orderScope === scope);
    let closest = null, distance = Infinity;
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2));
      if (d < distance) { distance = d; closest = Number(el.dataset.orderIndex); }
    }
    return closest;
  }
  return <div ref={root} aria-label={`Order ${label}`}>
    <p role="status" aria-live="polite" className="text-xs text-slate-600 mb-2">{status || (disabled ? '' : 'Drag the handle or use Move Up / Move Down to change order.')}</p>
    <fieldset disabled={globallySaving} className="min-w-0 border-0 p-0 m-0">
      <div className={className}>
        {items.map((item, index) => <div key={item.id} data-order-scope={scope} data-order-index={index}
          className={`relative min-w-0 rounded-xl ${target === index ? 'ring-4 ring-red-500' : ''}`}>
          {target === index && <span className="absolute right-0 -top-6 z-10 bg-red-700 text-white text-xs px-2 py-1 rounded">Drop {gesture.current?.from < index ? 'after' : 'before'} this card</span>}
          {!disabled && <div className="flex gap-2 items-center mb-2">
            <button ref={el => { if (el) handles.current.set(item.id, el); else handles.current.delete(item.id); }} type="button" aria-label={`Drag ${item.full_name || item.name || item.heading || item.caption || 'photo'}`} title="Drag to reorder; use arrow keys to move"
              className="touch-none cursor-grab p-2 rounded border bg-white"
              onKeyDown={e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(index, index + (['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 1)); } }}
              onPointerDown={e => { if (orderBusy || busy.current || e.button !== 0) return; e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); gesture.current = { from: index, to: index }; setTarget(index); }}
              onPointerMove={e => { if (!gesture.current) return; e.stopPropagation(); const to = point(e); gesture.current.to = to; setTarget(to); if (e.clientY < 70) window.scrollBy(0, -15); else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 15); }}
              onPointerUp={e => { e.stopPropagation(); const g = gesture.current; gesture.current = null; setTarget(null); if (g) move(g.from, g.to); }}
              onPointerCancel={() => { gesture.current = null; setTarget(null); }}><GripVertical size={16} /></button>
            <button type="button" disabled={index === 0} className="p-2 border rounded disabled:opacity-30" aria-label="Move Up" title="Move Up" onClick={() => move(index, index - 1)}><ArrowUp size={16} /></button>
            <button type="button" disabled={index === items.length - 1} className="p-2 border rounded disabled:opacity-30" aria-label="Move Down" title="Move Down" onClick={() => move(index, index + 1)}><ArrowDown size={16} /></button>
          </div>}
          {renderItem(item)}
        </div>)}
      </div>
    </fieldset>
  </div>;
}
