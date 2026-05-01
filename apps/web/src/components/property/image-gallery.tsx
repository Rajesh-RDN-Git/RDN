'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/modal';
import { ChevronIcon, CloseIcon } from '../ui/icons';

interface ImageGalleryProps {
  images: Array<{ url: string; type: string; order: number }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sorted = [...images].sort((a, b) => a.order - b.order);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowLeft') setSelectedIndex(Math.max(0, selectedIndex - 1));
      if (e.key === 'ArrowRight') setSelectedIndex(Math.min(sorted.length - 1, selectedIndex + 1));
    },
    [selectedIndex, sorted.length],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-subtle">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid layout: 1 large + 4 small */}
      <div className="grid h-[300px] grid-cols-3 gap-2 overflow-hidden rounded-xl md:h-[500px] md:grid-cols-3">
        {/* Main image - 2/3 width */}
        <button
          onClick={() => setSelectedIndex(0)}
          className="col-span-3 block overflow-hidden md:col-span-2"
        >
          <img
            src={sorted[0].url}
            alt="Property main"
            className="h-full w-full object-cover transition-transform duration-slow hover:scale-105"
          />
        </button>

        {/* Thumbnail grid - 1/3 width */}
        <div className="hidden grid-rows-2 gap-2 md:grid md:grid-cols-2 md:grid-rows-2">
          {sorted.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i + 1)}
              className="relative block overflow-hidden"
            >
              <img
                src={img.url}
                alt={`Property ${i + 2}`}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
              {/* "+N Photos" overlay on last thumbnail */}
              {i === 3 && sorted.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <span className="text-heading-md text-white">+{sorted.length - 5} Photos</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-5xl"
      >
        {selectedIndex !== null && (
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-card p-2 shadow-elevation-2 hover:bg-subtle"
            >
              <CloseIcon size={20} />
            </button>

            {/* Main image */}
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={sorted[selectedIndex].url}
                alt={`Property ${selectedIndex + 1}`}
                className="w-full rounded-lg"
              />

              {/* Prev/Next arrows */}
              {selectedIndex > 0 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-elevation-2 hover:bg-muted"
                >
                  <ChevronIcon size={24} direction="left" />
                </button>
              )}
              {selectedIndex < sorted.length - 1 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-elevation-2 hover:bg-muted"
                >
                  <ChevronIcon size={24} direction="right" />
                </button>
              )}
            </div>

            {/* Counter */}
            <p className="mt-3 text-center text-body-sm text-muted-foreground">
              {selectedIndex + 1} / {sorted.length}
            </p>

            {/* Thumbnail strip */}
            <div
              className="mt-3 flex gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {sorted.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === selectedIndex
                      ? 'border-brand opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
