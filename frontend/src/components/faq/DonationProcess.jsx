import React, { useEffect, useRef, useState } from 'react';
import './DonationProcess.css';
import { getDonationProcessContent, PROCESS_IMAGES } from '../../data/donationProcess.js';

// Measure the rendered rows so connectors follow the layout and never set text height.
function useConnectors(listRef) {
  const [drawing, setDrawing] = useState({ width: 1, height: 1, paths: [] });
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const measure = () => {
      const bounds = list.getBoundingClientRect();
      const items = [...list.children].filter(item => item.classList.contains('donation-process__step')).map(item => {
        const box = item.getBoundingClientRect();
        const art = item.querySelector('img').getBoundingClientRect();
        return { left: box.left - bounds.left, right: box.right - bounds.left,
          top: box.top - bounds.top, bottom: box.bottom - bounds.top,
          y: art.top - bounds.top + art.height * 0.6 };
      });
      const paths = items.slice(0, -1).map((current, index) => {
        const next = items[index + 1];
        if (Math.abs(current.top - next.top) < 2) {
          const middle = (current.right + next.left) / 2;
          return `M ${current.right} ${current.y} C ${middle} ${current.y - 20}, ${middle} ${next.y + 20}, ${next.left} ${next.y}`;
        }
        const singleColumn = Math.abs(current.left - next.left) < 30 && current.right > bounds.width / 2 && next.left < bounds.width / 2;
        if (singleColumn) {
          const right = index % 2 === 0;
          const x = right ? bounds.width - 3 : 3;
          const start = right ? current.right : current.left;
          const end = right ? next.right : next.left;
          return `M ${start} ${current.y} C ${x} ${current.y}, ${x} ${current.bottom}, ${x} ${(current.bottom + next.top) / 2} S ${x} ${next.y}, ${end} ${next.y}`;
        }
        const gapY = (current.bottom + next.top) / 2;
        return `M ${current.right} ${current.y} C ${bounds.width - 3} ${current.y}, ${bounds.width - 3} ${gapY}, ${current.right} ${gapY} L ${next.left} ${gapY} C 3 ${gapY}, 3 ${next.y}, ${next.left} ${next.y}`;
      });
      setDrawing({ width: bounds.width, height: bounds.height, paths });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    [...list.children].filter(item => item.classList.contains('donation-process__step')).forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [listRef]);
  return drawing;
}

export default function DonationProcess({ content }) {
  const text = getDonationProcessContent(content);
  const listRef = useRef(null);
  const drawing = useConnectors(listRef);
  return (
    <section className="donation-process" aria-labelledby="donation-journey-heading" id="donation-journey">
      <header className="donation-process__header">
        <p className="donation-process__eyebrow">{text.eyebrow}</p>
        <h2 id="donation-journey-heading">{text.heading}{text.heading && text.highlightedHeading ? ' ' : ''}<span>{text.highlightedHeading}</span></h2>
        <p>{text.subtitle}</p>
      </header>
      <div className="donation-process__map">
        <ol ref={listRef} className="donation-process__steps">
        {text.steps.map((step, index) => (
          <li className="donation-process__step" key={PROCESS_IMAGES[index]}>
            <img src={`/assets/process/${PROCESS_IMAGES[index]}.png`} alt="" width="1536" height="1024" loading="lazy" decoding="async" />
            <h3><span className="donation-process__number">{step.badge}</span>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
        </ol>
          <svg className="donation-process__connectors" aria-hidden="true" width="100%" height="100%" viewBox={`0 0 ${drawing.width} ${drawing.height}`} focusable="false">
            {drawing.paths.map((path, index) => <path key={index} d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray="6 6" strokeLinecap="round" />)}
          </svg>
      </div>
    </section>
  );
}
