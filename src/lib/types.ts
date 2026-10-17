// ============================================================================
// PostSnap — Shared TypeScript Types
// ============================================================================

/** How the PNG was produced */
export type GenerationMethod = 'captured' | 'recreated';

/** Result of URL validation */
export interface ValidationResult {
  valid: boolean;
  tweetId?: string;
  username?: string;
  error?: string;
}

/** Normalized tweet data from any retrieval source */
export interface TweetData {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
    verified: boolean;
  };
  createdAt: string;
  /** Single photo media — undefined if no image or inaccessible */
  media?: {
    type: 'photo';
    url: string;
    width: number;
    height: number;
  };
  /**
   * Engagement metrics — each field is undefined (NOT zero) when unavailable.
   * The entire object is undefined when no metrics could be retrieved.
   */
  metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    quotes?: number;
  };
  /** True when text exceeds standard tweet length (~280 chars) */
  isLongText: boolean;
}

/** Result of the capture/recreation pipeline */
export interface CaptureResult {
  image: Buffer;
  method: GenerationMethod;
  tweetData: TweetData;
  width: number;
  height: number;
}

/** Structured error for API responses */
export interface PostSnapError {
  error: string;
  code: PostSnapErrorCode;
  retryable: boolean;
  guidance: string;
}

/** Enumerated error codes mapped to specific failure conditions */
export type PostSnapErrorCode =
  | 'INVALID_URL'
  | 'NOT_A_TWEET'
  | 'TWEET_NOT_FOUND'
  | 'TWEET_INACCESSIBLE'
  | 'RATE_LIMITED'
  | 'CAPTURE_TIMEOUT'
  | 'GENERATION_FAILED'
  | 'MEDIA_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** Successful capture API response */
export interface CaptureResponse {
  success: true;
  imageBase64: string;
  method: GenerationMethod;
  tweet: {
    id: string;
    author: string;
    username: string;
    text: string;
    createdAt: string;
    hasMedia: boolean;
    hasMetrics: boolean;
  };
  dimensions: { width: number; height: number };
}

/** Error API response */
export interface ErrorResponse {
  success: false;
  error: PostSnapError;
}

/** Union type for all API responses */
export type ApiResponse = CaptureResponse | ErrorResponse;
