'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChevronIcon } from './icons';

interface CarouselProps {
  children: ReactNode[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  itemClassName?: string;
}

export function Carousel({
  children,
  autoplay = false,
  autoplayInterval = 4000,
  showDots = true,
  showArrows = true,
  className = '',
  itemClassName = '',
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemCount, setItemCount] = useState(children.length);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setItemCount(children.length);
  }, [children.length]);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const items = container.children;
    if (!items[index]) return;
    const item = items[index] as HTMLElement;
    container.scrollTo({
      left: item.offsetLeft - container.offsetLeft,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.children[0]
      ? (container.children[0] as HTMLElement).offsetWidth
      : 1;
    const newIndex = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(newIndex, itemCount - 1));
  }, [itemCount]);

  useEffect(() => {
    if (!autoplay || itemCount <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % itemCount;
        scrollToIndex(next);
        return next;
      });
    }, autoplayInterval);
    return () => clearInterval(intervalRef.current);
  }, [autoplay, autoplayInterval, itemCount, scrollToIndex]);

  const pauseAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const arrowBtn =
    'absolute top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-border bg-popover text-foreground shadow-elevation-2 opacity-0 transition-opacity duration-fast group-hover:opacity-100 hover:bg-muted disabled:opacity-0';

  return (
    <div className={`group relative ${className}`} onMouseEnter={pauseAutoplay}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children.map((child, i) => (
          <div key={i} className={`flex-shrink-0 snap-start ${itemClassName}`}>
            {child}
          </div>
        ))}
      </div>

      {showArrows && itemCount > 1 && (
        <>
          <button
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            className={`${arrowBtn} left-2`}
            disabled={activeIndex === 0}
            aria-label="Previous"
          >
            <ChevronIcon size={18} direction="left" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(itemCount - 1, activeIndex + 1))}
            className={`${arrowBtn} right-2`}
            disabled={activeIndex === itemCount - 1}
            aria-label="Next"
          >
            <ChevronIcon size={18} direction="right" />
          </button>
        </>
      )}

      {showDots && itemCount > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: itemCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all duration-fast ${
                i === activeIndex
                  ? 'w-6 bg-brand'
                  : 'w-2 bg-border-strong hover:bg-muted-foreground'
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
