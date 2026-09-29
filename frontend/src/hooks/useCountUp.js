import { useState, useEffect, useRef } from 'react';

/**
 * Quartic ease-out function.
 * Fast acceleration at start, ultra-smooth deceleration towards target.
 * f(0) = 0, f(1) = 1.
 */
export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Parses a metric value to determine its numeric target, suffix, and formatted string.
 */
export function parseMetricValue(value, rawValue) {
  if (typeof rawValue === 'number' && !isNaN(rawValue)) {
    const isZero = rawValue === 0;
    const strVal = value !== null && value !== undefined ? String(value).trim() : '';
    const hasPlus = !isZero && strVal.endsWith('+');
    return {
      isNumeric: true,
      target: rawValue,
      suffix: hasPlus ? '+' : '',
      formattedTarget: strVal || (isZero ? '0' : `${rawValue.toLocaleString()}${hasPlus ? '+' : ''}`)
    };
  }

  if (value === null || value === undefined || value === '') {
    return {
      isNumeric: false,
      target: null,
      suffix: '',
      formattedTarget: '—'
    };
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      return { isNumeric: false, target: null, suffix: '', formattedTarget: '—' };
    }
    return {
      isNumeric: true,
      target: value,
      suffix: '',
      formattedTarget: value === 0 ? '0' : value.toLocaleString()
    };
  }

  const str = String(value).trim();
  if (str === '—' || str === '-' || str === 'Loading...') {
    return {
      isNumeric: false,
      target: null,
      suffix: '',
      formattedTarget: str
    };
  }

  const hasPlus = str.endsWith('+');
  const cleanStr = hasPlus ? str.slice(0, -1).trim() : str;
  const num = Number(cleanStr.replace(/,/g, ''));

  if (isNaN(num)) {
    return {
      isNumeric: false,
      target: null,
      suffix: '',
      formattedTarget: str
    };
  }

  return {
    isNumeric: true,
    target: num,
    suffix: num === 0 ? '' : (hasPlus ? '+' : ''),
    formattedTarget: str
  };
}

/**
 * Hook to animate a metric counter from 0 to target when triggered.
 */
export function useCountUp({
  value,
  raw,
  enabled = false,
  duration = 1800
}) {
  const parsed = parseMetricValue(value, raw);
  const [displayValue, setDisplayValue] = useState(() => {
    if (!parsed.isNumeric || parsed.target === 0) {
      return parsed.formattedTarget;
    }
    return '0';
  });

  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!parsed.isNumeric) {
      setDisplayValue(parsed.formattedTarget);
      return;
    }

    if (parsed.target === 0) {
      setDisplayValue('0');
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(parsed.formattedTarget);
      hasAnimatedRef.current = true;
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(parsed.formattedTarget);
      return;
    }

    if (!enabled) {
      return;
    }

    hasAnimatedRef.current = true;
    let startTime = null;
    let animationFrameId = null;

    const startValue = 0;
    const endValue = parsed.target;
    const suffix = parsed.suffix;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const current = Math.round(startValue + (endValue - startValue) * easedProgress);

      if (progress < 1) {
        setDisplayValue(`${current.toLocaleString()}${suffix}`);
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(parsed.formattedTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled, parsed.isNumeric, parsed.target, parsed.suffix, parsed.formattedTarget, duration]);

  return {
    displayValue,
    finalValue: parsed.formattedTarget,
    isNumeric: parsed.isNumeric
  };
}
