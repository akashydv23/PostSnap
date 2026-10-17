// ============================================================================
// PostSnap — Disclosure Utilities
// ============================================================================
//
// Handles the generation method labeling for preview UI and PNG metadata.
// Per PRD FR-09: "Clearly label recreated output in the preview and on or
// alongside the downloaded artifact in a persistent, legible way."
// ============================================================================

import { GenerationMethod } from './types';

/** Disclosure text for each generation method */
export const DISCLOSURE_TEXT: Record<GenerationMethod, string> = {
  captured: 'Captured from X',
  recreated: 'Recreated from available post data',
};

/** Badge styling info for the preview UI */
export interface DisclosureBadge {
  text: string;
  variant: 'success' | 'warning';
  icon: string;
  description: string;
}

/**
 * Get disclosure badge information for display in the preview UI.
 */
export function getDisclosureBadge(method: GenerationMethod): DisclosureBadge {
  if (method === 'captured') {
    return {
      text: DISCLOSURE_TEXT.captured,
      variant: 'success',
      icon: '✓',
      description:
        'This image was captured from the official X embedded post rendering.',
    };
  }

  return {
    text: DISCLOSURE_TEXT.recreated,
    variant: 'warning',
    icon: '⚠',
    description:
      'This image was recreated from available post data because the original rendering could not be captured. Text and values are preserved exactly as retrieved.',
  };
}

/**
 * Get the download filename for a captured/recreated tweet.
 */
export function getDownloadFilename(
  tweetId: string,
  method: GenerationMethod
): string {
  const timestamp = Date.now();
  const suffix = method === 'recreated' ? '-recreated' : '';
  return `postsnap-${tweetId}${suffix}-${timestamp}.png`;
}
