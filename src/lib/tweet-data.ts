// ============================================================================
// PostSnap — Tweet Data Fetching via react-tweet Syndication API
// ============================================================================

import { getTweet } from 'react-tweet/api';
import { TweetData, PostSnapError } from './types';

/**
 * Custom error class carrying a PostSnapError for typed API responses.
 */
export class TweetFetchError extends Error {
  public readonly postSnapError: PostSnapError;

  constructor(postSnapError: PostSnapError) {
    super(postSnapError.error);
    this.name = 'TweetFetchError';
    this.postSnapError = postSnapError;
  }
}

/**
 * Fetch tweet data from Twitter's Syndication API via react-tweet.
 *
 * Maps the raw react-tweet response into our normalized TweetData shape.
 * - Never fabricates missing fields; metrics and media are optional.
 * - Throws TweetFetchError with structured PostSnapError for error handling.
 *
 * @param tweetId - Numeric tweet ID string
 * @returns Normalized TweetData
 * @throws TweetFetchError on retrieval failure
 */
export async function fetchTweetData(tweetId: string): Promise<TweetData> {
  let rawTweet;

  try {
    rawTweet = await getTweet(tweetId);
  } catch (err) {
    // Network or rate-limit errors from the syndication endpoint
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('rate') || message.includes('429')) {
      throw new TweetFetchError({
        error: 'Rate limited by Twitter. Please try again in a moment.',
        code: 'RATE_LIMITED',
        retryable: true,
        guidance: 'Wait 30 seconds and try again.',
      });
    }

    throw new TweetFetchError({
      error: `Failed to fetch post data: ${message}`,
      code: 'INTERNAL_ERROR',
      retryable: true,
      guidance: 'Please try again. If the problem persists, the post may be unavailable.',
    });
  }

  // Tweet not found — deleted, suspended, or private
  if (!rawTweet) {
    throw new TweetFetchError({
      error: 'This post could not be found. It may have been deleted or made private.',
      code: 'TWEET_NOT_FOUND',
      retryable: false,
      guidance: 'Check that the URL is correct and that the post is publicly accessible.',
    });
  }

  // Check for tombstone (deleted/suspended indicator in syndication API)
  if ('tombstone' in rawTweet && rawTweet.tombstone) {
    throw new TweetFetchError({
      error: 'This post is from a suspended or deactivated account and cannot be accessed.',
      code: 'TWEET_INACCESSIBLE',
      retryable: false,
      guidance: 'The account associated with this post is no longer available.',
    });
  }

  // Map to normalized TweetData
  return mapToTweetData(rawTweet);
}

/**
 * Map the raw react-tweet response to our TweetData interface.
 * Only includes fields that are actually present — never fabricates values.
 */
function mapToTweetData(raw: NonNullable<Awaited<ReturnType<typeof getTweet>>>): TweetData {
  const user = raw.user;
  const text = raw.text ?? '';

  // Build author info
  const author = {
    name: user.name ?? 'Unknown',
    username: user.screen_name ?? 'unknown',
    avatarUrl: user.profile_image_url_https?.replace('_normal', '_400x400') ?? '',
    verified: user.is_blue_verified ?? user.verified ?? false,
  };

  // Extract timestamp
  const createdAt = raw.created_at ?? '';

  // Extract single photo media (MVP: first photo only)
  let media: TweetData['media'] = undefined;
  if (raw.photos && raw.photos.length > 0) {
    const photo = raw.photos[0];
    media = {
      type: 'photo',
      url: photo.url,
      width: photo.width,
      height: photo.height,
    };
  } else if (
    raw.mediaDetails &&
    raw.mediaDetails.length > 0 &&
    raw.mediaDetails[0].type === 'photo'
  ) {
    const md = raw.mediaDetails[0];
    media = {
      type: 'photo',
      url: md.media_url_https,
      width: md.original_info?.width ?? 0,
      height: md.original_info?.height ?? 0,
    };
  }

  // Extract metrics — ONLY include values that actually exist.
  // Per PRD: "Never substitute zero or a plausible value."
  let metrics: TweetData['metrics'] = undefined;
  const hasAnyMetric =
    raw.favorite_count !== undefined ||
    raw.conversation_count !== undefined;

  if (hasAnyMetric) {
    metrics = {};
    if (raw.favorite_count !== undefined && raw.favorite_count !== null) {
      metrics.likes = raw.favorite_count;
    }
    // react-tweet uses conversation_count for replies
    if (raw.conversation_count !== undefined && raw.conversation_count !== null) {
      metrics.replies = raw.conversation_count;
    }
  }

  return {
    id: raw.id_str ?? String(raw.id_str),
    text,
    author,
    createdAt,
    media,
    metrics,
    isLongText: text.length > 280,
  };
}
