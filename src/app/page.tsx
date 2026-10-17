'use client';

// ============================================================================
// PostSnap — Main Home Page
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { UrlInput } from '@/components/url-input';
import { StatusIndicator } from '@/components/status-indicator';
import { CapturePreview } from '@/components/capture-preview';
import { ErrorDisplay } from '@/components/error-display';
import { CaptureResponse, PostSnapError } from '@/lib/types';

type FlowState = 'idle' | 'processing' | 'preview' | 'error';
type ProgressStage = 'validating' | 'fetching' | 'capturing' | 'generating';

export default function Home() {
  const [state, setState] = useState<FlowState>('idle');
  const [stage, setStage] = useState<ProgressStage>('validating');
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const [error, setError] = useState<PostSnapError | null>(null);
  const lastSubmittedUrl = useRef<string>('');

  const handleCapture = useCallback(async (url: string) => {
    lastSubmittedUrl.current = url;
    setState('processing');
    setError(null);
    setResult(null);

    // Simulate progress stages to provide immediate, responsive user feedback
    setStage('validating');
    const timer1 = setTimeout(() => setStage('fetching'), 400);
    const timer2 = setTimeout(() => setStage('capturing'), 1400);
    const timer3 = setTimeout(() => setStage('generating'), 3500);

    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error || {
            error: 'Failed to process post',
            code: 'INTERNAL_ERROR',
            retryable: true,
            guidance: 'Please try again later.',
          }
        );
        setState('error');
        return;
      }

      setResult(data as CaptureResponse);
      setState('preview');
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setError({
        error: 'Network error or request timeout',
        code: 'INTERNAL_ERROR',
        retryable: true,
        guidance: 'Check your internet connection and try again.',
      });
      setState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (lastSubmittedUrl.current) {
      handleCapture(lastSubmittedUrl.current);
    } else {
      handleReset();
    }
  }, [handleCapture, handleReset]);

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--postsnap-accent)]/10 text-[var(--postsnap-accent)]">
          <span>⚡</span> MVP 1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--postsnap-fg)]">
          Post<span className="text-[var(--postsnap-accent)]">Snap</span>
        </h1>
        <p className="text-base sm:text-lg text-[var(--postsnap-muted)] max-w-xl">
          Turn an X / Twitter post into a clean, previewable, and downloadable PNG image.
          Official visual capture with honest recreation disclosure.
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full py-4">
        {state === 'idle' && (
          <div className="w-full space-y-8">
            <UrlInput onSubmit={handleCapture} isLoading={false} />

            {/* Quick Feature Hints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 text-sm text-[var(--postsnap-muted)]">
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--postsnap-border)]/60 bg-[var(--postsnap-card-bg)]">
                <span className="text-base">📸</span>
                <div>
                  <strong className="block text-[var(--postsnap-fg)] font-medium">Rendered Capture</strong>
                  Preserves official X styling, typography & light/dark appearance.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--postsnap-border)]/60 bg-[var(--postsnap-card-bg)]">
                <span className="text-base">🛡️</span>
                <div>
                  <strong className="block text-[var(--postsnap-fg)] font-medium">Honest Disclosure</strong>
                  Transparent labeling whenever a post is recreated vs captured.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--postsnap-border)]/60 bg-[var(--postsnap-card-bg)]">
                <span className="text-base">✨</span>
                <div>
                  <strong className="block text-[var(--postsnap-fg)] font-medium">High DPI PNG</strong>
                  Retina-ready 2x export without account or watermark noise.
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="w-full space-y-6">
            <UrlInput onSubmit={handleCapture} isLoading={true} disabled={true} />
            <StatusIndicator stage={stage} />
          </div>
        )}

        {state === 'preview' && result && (
          <CapturePreview data={result} onReset={handleReset} />
        )}

        {state === 'error' && error && (
          <ErrorDisplay error={error} onRetry={handleRetry} onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-[var(--postsnap-muted)] space-y-2">
        <p>
          PostSnap respects privacy and platform access terms. It never invents metrics, bypasses paywalls, or accesses private accounts.
        </p>
        <p className="opacity-75">
          Twitter / X is a trademark of X Corp. PostSnap is an independent utility.
        </p>
      </footer>
    </main>
  );
}
