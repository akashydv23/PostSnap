'use client';

// ============================================================================
// PostSnap — Capture Preview & Download Component
// ============================================================================

import { useCallback, useState } from 'react';
import { CaptureResponse } from '@/lib/types';
import { getDisclosureBadge } from '@/lib/disclosure';

interface CapturePreviewProps {
  data: CaptureResponse;
  onReset: () => void;
}

export function CapturePreview({ data, onReset }: CapturePreviewProps) {
  const [downloading, setDownloading] = useState(false);
  const badge = getDisclosureBadge(data.method);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: data.imageBase64,
          tweetId: data.tweet.id,
          method: data.method,
        }),
      });

      if (!response.ok) throw new Error('Download failed');

      // Create a download link from the blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        `postsnap-${data.tweet.id}${data.method === 'recreated' ? '-recreated' : ''}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: direct base64 download
      const a = document.createElement('a');
      a.href = `data:image/png;base64,${data.imageBase64}`;
      a.download = `postsnap-${data.tweet.id}-${Date.now()}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }, [data]);

  const imageSrc = `data:image/png;base64,${data.imageBase64}`;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Disclosure Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          badge.variant === 'success'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        }`}
        title={badge.description}
        role="status"
      >
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </div>

      {/* Image Preview */}
      <div className="rounded-xl overflow-hidden border border-[var(--postsnap-border)] shadow-lg">
        <img
          src={imageSrc}
          alt={`PostSnap capture of @${data.tweet.username}'s post`}
          className="w-full h-auto"
          style={{ maxHeight: '80vh', objectFit: 'contain' }}
        />
      </div>

      {/* Tweet Info */}
      <div className="flex items-center justify-between text-sm text-[var(--postsnap-muted)]">
        <span>
          @{data.tweet.username} · {data.dimensions.width}×{data.dimensions.height}px
        </span>
        <span>PNG</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 px-6 py-3 rounded-xl font-semibold text-white text-base transition-all
            bg-[var(--postsnap-accent)] hover:bg-[#1a8cd8] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Downloading...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PNG
            </span>
          )}
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl font-semibold text-base transition-all
            border border-[var(--postsnap-border)] text-[var(--postsnap-fg)]
            hover:bg-[var(--postsnap-input-bg)] active:scale-[0.98]"
        >
          Try Another
        </button>
      </div>
    </div>
  );
}
