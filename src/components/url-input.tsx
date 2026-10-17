'use client';

// ============================================================================
// PostSnap — URL Input Component
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

/** Quick client-side check — full validation happens server-side */
function isLikelyTweetUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(twitter\.com|x\.com|mobile\.twitter\.com)\/\w+\/status\/\d+/i.test(
    url.trim()
  );
}

export function UrlInput({ onSubmit, isLoading, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [clientError, setClientError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = url.trim();
      if (!trimmed) {
        setClientError('Please enter a URL.');
        return;
      }

      if (!isLikelyTweetUrl(trimmed)) {
        setClientError(
          'This doesn\'t look like an X post URL. Try a link like https://x.com/user/status/123456789'
        );
        return;
      }

      setClientError('');
      onSubmit(trimmed);
    },
    [url, onSubmit]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setClientError(''); // Clear error on edit
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      // Auto-submit on paste if the pasted text looks like a valid URL
      const pasted = e.clipboardData.getData('text').trim();
      if (isLikelyTweetUrl(pasted)) {
        // Let the paste complete first, then submit
        setTimeout(() => {
          setUrl(pasted);
          setClientError('');
          onSubmit(pasted);
        }, 50);
      }
    },
    [onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Paste an X post URL..."
            disabled={isLoading || disabled}
            aria-label="X post URL"
            aria-describedby={clientError ? 'url-error' : undefined}
            aria-invalid={!!clientError}
            className="flex-1 px-4 py-3 rounded-xl border text-base transition-colors
              bg-[var(--postsnap-input-bg)] border-[var(--postsnap-border)] 
              text-[var(--postsnap-fg)] placeholder:text-[var(--postsnap-muted)]
              focus:border-[var(--postsnap-accent)] focus:ring-2 focus:ring-[var(--postsnap-accent)]/20
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || disabled || !url.trim()}
            className="px-6 py-3 rounded-xl font-semibold text-white text-base transition-all
              bg-[var(--postsnap-accent)] hover:bg-[#1a8cd8] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--postsnap-accent)]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>
        {clientError && (
          <p id="url-error" role="alert" className="text-sm text-[var(--postsnap-error)] px-1">
            {clientError}
          </p>
        )}
      </div>
    </form>
  );
}
