import React, { useEffect, useRef, useState } from 'react';
import './DonationProcess.css';

const steps = [
  { image: 'donation', title: 'Donation', description: 'Your journey begins with a health check and a blood donation, supported by trained staff.' },
  { image: 'testing', title: 'Testing', description: 'The collected blood is tested for blood group and screened for infections before it can be used.' },
  { image: 'separation', title: 'Separation', description: 'Blood is processed to separate it into components, including red blood cells, plasma and platelets.' },
  { image: 'components', title: 'Components', description: 'Each component has a different purpose and is stored under the conditions it needs.' },
  { image: 'helping-patients', title: 'Helping Patients', description: 'These components support patients receiving cancer treatment, recovering from injuries, undergoing surgery and more.' },
  { image: 'new-beginnings', title: 'New Beginnings', description: 'Your donation can help more than one patient and give people another chance at a healthier tomorrow.' },
];

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

export default function DonationProcess() {
  const listRef = useRef(null);
  const drawing = useConnectors(listRef);
  return (
    <section className="donation-process" aria-labelledby="donation-journey-heading" id="donation-journey">
      <header className="donation-process__header">
        <p className="donation-process__eyebrow">The Process</p>
        <h2 id="donation-journey-heading">From Your Donation to a <span>New Beginning</span></h2>
        <p>A simple process. A powerful impact.</p>
      </header>
      <div className="donation-process__map">
        <ol ref={listRef} className="donation-process__steps">
        {steps.map((step, index) => (
          <li className="donation-process__step" key={step.image}>
            <img src={`/assets/process/${step.image}.png`} alt="" width="1536" height="1024" loading="lazy" decoding="async" />
            <h3><span className="donation-process__number">{index + 1}</span>{step.title}</h3>
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
