'use client';

import { useState, useCallback, useRef } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  className?: string;
}

const formatINR = (value: number): string => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(0)} L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString('en-IN');
};

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = formatINR,
  className = '',
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + percent * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step],
  );

  const handlePointerDown = (handle: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(handle);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newVal = getValueFromPosition(e.clientX);
      if (dragging === 'min') {
        onChange([Math.min(newVal, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + step)]);
      }
    },
    [dragging, getValueFromPosition, onChange, value, step],
  );

  const handlePointerUp = () => setDragging(null);

  const minPercent = getPercent(value[0]);
  const maxPercent = getPercent(value[1]);

  const handleClasses =
    'absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-brand bg-card shadow-elevation-1 transition-shadow duration-fast hover:shadow-elevation-2 active:cursor-grabbing';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-label-sm text-foreground tabular-nums">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-subtle" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <div
          className={`${handleClasses} ${dragging === 'min' ? 'ring-2 ring-brand/30' : ''}`}
          style={{ left: `${minPercent}%` }}
          onPointerDown={handlePointerDown('min')}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={value[1]}
          aria-valuenow={value[0]}
          aria-label="Minimum value"
          tabIndex={0}
        />
        <div
          className={`${handleClasses} ${dragging === 'max' ? 'ring-2 ring-brand/30' : ''}`}
          style={{ left: `${maxPercent}%` }}
          onPointerDown={handlePointerDown('max')}
          role="slider"
          aria-valuemin={value[0]}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-label="Maximum value"
          tabIndex={0}
        />
      </div>
    </div>
  );
}
