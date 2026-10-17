'use client';

// ============================================================================
// PostSnap — Error Display Component
// ============================================================================

import { PostSnapError } from '@/lib/types';

interface ErrorDisplayProps {
  error: PostSnapError;
  onRetry?: () => void;
  onReset: () => void;
}

/** Map error codes to icons */
function getErrorIcon(code: PostSnapError['code']): string {
  switch (code) {
    case 'INVALID_URL':
    case 'NOT_A_TWEET':
      return '🔗';
    case 'TWEET_NOT_FOUND':
    case 'TWEET_INACCESSIBLE':
      return '🔒';
    case 'RATE_LIMITED':
      return '⏱️';
    case 'CAPTURE_TIMEOUT':
    case 'GENERATION_FAILED':
      return '⚠️';
    case 'MEDIA_UNAVAILABLE':
      return '🖼️';
    default:
      return '❌';
  }
}

export function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  const icon = getErrorIcon(error.code);

  return (
    <div
      className="w-full max-w-lg mx-auto rounded-xl border border-[var(--postsnap-error)]/20 
        bg-[var(--postsnap-error)]/5 p-6 space-y-4"
      role="alert"
    >
      {/* Error header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <div className="space-y-1">
          <h3 className="font-semibold text-[var(--postsnap-fg)]">{error.error}</h3>
          <p className="text-sm text-[var(--postsnap-muted)]">{error.guidance}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all
              bg-[var(--postsnap-accent)] hover:bg-[#1a8cd8] active:scale-[0.98]"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all
            border border-[var(--postsnap-border)] text-[var(--postsnap-muted)]
            hover:bg-[var(--postsnap-input-bg)]"
        >
          {error.retryable ? 'Try Different URL' : 'Go Back'}
        </button>
      </div>

      {/* Error code (subtle) */}
      <p className="text-xs text-[var(--postsnap-muted)]/50 pt-1">
        Error code: {error.code}
      </p>
    </div>
  );
}
