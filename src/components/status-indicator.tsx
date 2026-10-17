'use client';

// ============================================================================
// PostSnap — Status Indicator Component
// ============================================================================

interface StatusIndicatorProps {
  stage: 'validating' | 'fetching' | 'capturing' | 'generating';
}

const STAGE_LABELS: Record<StatusIndicatorProps['stage'], string> = {
  validating: 'Validating URL...',
  fetching: 'Fetching post data...',
  capturing: 'Capturing post...',
  generating: 'Generating image...',
};

const STAGE_ORDER: StatusIndicatorProps['stage'][] = [
  'validating',
  'fetching',
  'capturing',
  'generating',
];

export function StatusIndicator({ stage }: StatusIndicatorProps) {
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div
      className="w-full max-w-md mx-auto py-8"
      role="status"
      aria-live="polite"
      aria-label={STAGE_LABELS[stage]}
    >
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-4">
        {STAGE_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentIndex
                ? 'bg-[var(--postsnap-accent)]'
                : 'bg-[var(--postsnap-border)]'
            }`}
          />
        ))}
      </div>

      {/* Stage label with spinner */}
      <div className="flex items-center justify-center gap-3 text-[var(--postsnap-muted)]">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
        <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
      </div>
    </div>
  );
}
