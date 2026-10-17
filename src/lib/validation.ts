// ============================================================================
// PostSnap — URL Validation & Tweet ID Extraction
// ============================================================================

import { ValidationResult } from './types';

/**
 * Supported hostname patterns for X/Twitter URLs.
 * Covers twitter.com, x.com, www. variants, and mobile.twitter.com.
 */
const VALID_HOSTS = new Set([
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'x.com',
  'www.x.com',
]);

/**
 * Regex to extract a tweet ID from the URL pathname.
 * Matches: /<username>/status/<tweetId> with optional trailing segments.
 * Tweet IDs are purely numeric, typically 15–20 digits.
 */
const TWEET_PATH_REGEX = /^\/([a-zA-Z0-9_]{1,15})\/status\/(\d{1,25})\/?/;

/**
 * Validate and parse an X post URL, extracting the tweet ID and username.
 *
 * Handles:
 * - twitter.com, x.com, mobile.twitter.com (http/https, www)
 * - Query params and hash fragments (stripped)
 * - Specific error messages per failure condition
 *
 * @param url - Raw user input URL string
 * @returns Validation result with tweetId/username or error message
 */
export function validateTweetUrl(url: string): ValidationResult {
  // Check for empty/whitespace input
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a URL.',
    };
  }

  // Attempt to parse as URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error:
        'Please enter a valid URL starting with http:// or https://.',
    };
  }

  // Verify protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error:
        'Please enter a valid URL starting with http:// or https://.',
    };
  }

  // Verify hostname is Twitter/X
  const host = parsed.hostname.toLowerCase();
  if (!VALID_HOSTS.has(host)) {
    return {
      valid: false,
      error:
        'Only Twitter/X post URLs are supported (twitter.com or x.com).',
    };
  }

  // Extract tweet ID from pathname
  const match = parsed.pathname.match(TWEET_PATH_REGEX);
  if (!match) {
    return {
      valid: false,
      error:
        'This URL doesn\'t point to a specific post. Please use a direct post link (e.g., https://x.com/user/status/123456789).',
    };
  }

  const username = match[1];
  const tweetId = match[2];

  return {
    valid: true,
    tweetId,
    username,
  };
}
