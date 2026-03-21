'use client';

import { useState } from 'react';
import { Modal } from '../ui/modal';

interface ImageGalleryProps {
  images: Array<{ url: string; type: string; order: number }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sorted = [...images].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 md:col-span-2 md:row-span-2">
          <button
            onClick={() => setSelectedIndex(0)}
            className="block h-full w-full overflow-hidden rounded-xl"
          >
            <img
              src={sorted[0].url}
              alt="Property main"
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        </div>
        {sorted.slice(1, 5).map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i + 1)}
            className="relative block aspect-[4/3] overflow-hidden rounded-lg"
          >
            <img
              src={img.url}
              alt={`Property ${i + 2}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
            {i === 3 && sorted.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-lg font-bold text-white">+{sorted.length - 5}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <Modal
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-4xl"
      >
        {selectedIndex !== null && (
          <div className="relative">
            <img
              src={sorted[selectedIndex].url}
              alt={`Property ${selectedIndex + 1}`}
              className="w-full rounded-lg"
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                disabled={selectedIndex === 0}
                className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {selectedIndex + 1} / {sorted.length}
              </span>
              <button
                onClick={() => setSelectedIndex(Math.min(sorted.length - 1, selectedIndex + 1))}
                disabled={selectedIndex === sorted.length - 1}
                className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
