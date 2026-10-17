// ============================================================================
// PostSnap — Capture Orchestrator
// ============================================================================
//
// Implements the capture decision logic from PRD Section 4:
//   1. Validate URL → extract tweet ID
//   2. Fetch tweet data via syndication API
//   3. Try official embed capture (primary path)
//   4. If capture fails → try recreation (fallback path)
//   5. If both fail → return structured error
// ============================================================================

import { validateTweetUrl } from '../validation';
import { fetchTweetData, TweetFetchError } from '../tweet-data';
import { captureViaEmbed } from './embed-capture';
import { captureViaRecreation } from './recreation-capture';
import { CaptureResult, PostSnapError } from '../types';

/**
 * Custom error class carrying a PostSnapError for the API layer.
 */
export class CaptureError extends Error {
  public readonly postSnapError: PostSnapError;

  constructor(postSnapError: PostSnapError) {
    super(postSnapError.error);
    this.name = 'CaptureError';
    this.postSnapError = postSnapError;
  }
}

/**
 * Main capture pipeline: URL → validated tweet → capture attempt → PNG result.
 *
 * @param url - Raw X post URL from user input
 * @returns CaptureResult with PNG buffer, method, and tweet metadata
 * @throws CaptureError with structured PostSnapError on any failure
 */
export async function captureTweet(url: string): Promise<CaptureResult> {
  // ── Step 1: Validate URL ──────────────────────────────────────────────
  const validation = validateTweetUrl(url);
  if (!validation.valid || !validation.tweetId) {
    throw new CaptureError({
      error: validation.error || 'Invalid URL',
      code: 'INVALID_URL',
      retryable: false,
      guidance: 'Please enter a valid X post URL (e.g., https://x.com/user/status/123456789).',
    });
  }

  const { tweetId } = validation;

  // ── Step 2: Fetch tweet data ──────────────────────────────────────────
  let tweetData;
  try {
    tweetData = await fetchTweetData(tweetId);
  } catch (err) {
    if (err instanceof TweetFetchError) {
      throw new CaptureError(err.postSnapError);
    }
    throw new CaptureError({
      error: 'Failed to retrieve post data.',
      code: 'INTERNAL_ERROR',
      retryable: true,
      guidance: 'Please try again. If the problem persists, the post may be unavailable.',
    });
  }

  // ── Step 3: Try official embed capture (primary path) ─────────────────
  const timeoutMs = parseInt(process.env.CAPTURE_TIMEOUT_MS || '10000', 10);

  console.log(`[PostSnap] Attempting embed capture for tweet ${tweetId}...`);
  const embedResult = await captureViaEmbed({
    tweetId,
    theme: 'light', // Default to light; could detect from embed in future
    timeoutMs,
  });

  if (embedResult) {
    console.log(`[PostSnap] Embed capture succeeded for tweet ${tweetId}`);
    return {
      image: embedResult.image,
      method: 'captured',
      tweetData,
      width: embedResult.width,
      height: embedResult.height,
    };
  }

  // ── Step 4: Fallback to recreation ────────────────────────────────────
  console.log(`[PostSnap] Embed capture failed, attempting recreation for tweet ${tweetId}...`);
  const recreationResult = await captureViaRecreation({
    tweetData,
    theme: 'light',
    timeoutMs,
  });

  if (recreationResult) {
    console.log(`[PostSnap] Recreation capture succeeded for tweet ${tweetId}`);
    return {
      image: recreationResult.image,
      method: 'recreated',
      tweetData,
      width: recreationResult.width,
      height: recreationResult.height,
    };
  }

  // ── Step 5: Both paths failed ─────────────────────────────────────────
  throw new CaptureError({
    error: 'We couldn\'t generate an image for this post right now.',
    code: 'GENERATION_FAILED',
    retryable: true,
    guidance: 'Please try again. If the problem persists, this post type may not be supported yet.',
  });
}
