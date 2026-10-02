import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  format?: 'currency' | 'integer' | 'decimal';
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  format = 'integer',
  duration = 1200,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad: 1 - (1 - t)^2
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const currentVal = value * easeProgress;

      if (format === 'currency') {
        setDisplayValue(Math.floor(currentVal).toLocaleString('en-IN'));
      } else if (format === 'integer') {
        setDisplayValue(Math.floor(currentVal).toLocaleString('en-US'));
      } else if (format === 'decimal') {
        setDisplayValue(currentVal.toFixed(1));
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        if (format === 'currency') {
          setDisplayValue(Math.floor(value).toLocaleString('en-IN'));
        } else if (format === 'integer') {
          setDisplayValue(Math.floor(value).toLocaleString('en-US'));
        } else if (format === 'decimal') {
          setDisplayValue(value.toFixed(1));
        }
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, format, duration]);

  return (
    <span className={`font-tabular ${className}`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};
