'use client';

import { useState, useRef } from 'react';
import { useWizard } from '../wizard-context';
import { mediaApi } from '@/lib/api/media.api';
import { PhotoState } from '../wizard-types';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 15;
const MAX_DIM = 1920;

async function downscaleImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    img.onload = () => {
      const ratio = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Blob conversion failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotosStep() {
  const { state, dispatch } = useWizard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = state.data.photos;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    setBusy(true);
    setError(null);
    const next: PhotoState[] = [...photos];
    try {
      for (const file of Array.from(files)) {
        const blob = await downscaleImage(file);
        const presigned = await mediaApi.getPresignedUrl({
          fileName: file.name,
          contentType: 'image/jpeg',
        });
        const { uploadUrl, key, cdnUrl, mock } = presigned.data;
        // In local/dev with no S3 configured the API returns a mock URL that
        // would 404 on PUT — skip the upload so the wizard flow still works.
        if (!mock) {
          await mediaApi.upload(uploadUrl, blob);
        }
        const localUrl = URL.createObjectURL(blob);
        next.push({
          id: key,
          key,
          url: localUrl,
          persistUrl: cdnUrl,
          isCover: next.length === 0,
          order: next.length,
        });
      }
      dispatch({ type: 'SET_PHOTOS', photos: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const setCover = (id: string) => {
    dispatch({
      type: 'SET_PHOTOS',
      photos: photos.map((p) => ({ ...p, isCover: p.id === id })),
    });
  };

  const remove = (id: string) => {
    dispatch({
      type: 'SET_PHOTOS',
      photos: photos.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })),
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-foreground">Drag photos here or tap to add photos</p>
        <p className="text-sm text-muted-foreground mt-1">
          {photos.length}/{MAX_PHOTOS} uploaded
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy}
        />
      </div>
      {photos.length < MIN_PHOTOS && (
        <p className="text-warning text-sm">At least 3 photos required to publish.</p>
      )}
      {error && <p className="text-error text-sm">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              className={`w-full h-32 object-cover rounded ${p.isCover ? 'ring-2 ring-brand' : ''}`}
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/50 rounded flex items-center justify-center gap-2">
              <button type="button" className="text-white text-sm" onClick={() => setCover(p.id)}>
                Cover
              </button>
              <button type="button" className="text-white text-sm" onClick={() => remove(p.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
