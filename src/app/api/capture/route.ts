// ============================================================================
// PostSnap — /api/capture Route Handler
// ============================================================================
//
// POST /api/capture
// Body: { url: string }
// Returns: CaptureResponse | ErrorResponse
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { captureTweet, CaptureError } from '@/lib/capture';
import { CaptureResponse, ErrorResponse, PostSnapErrorCode } from '@/lib/types';

/** Map error codes to HTTP status codes */
const ERROR_STATUS_MAP: Record<PostSnapErrorCode, number> = {
  INVALID_URL: 400,
  NOT_A_TWEET: 400,
  TWEET_NOT_FOUND: 404,
  TWEET_INACCESSIBLE: 404,
  RATE_LIMITED: 429,
  CAPTURE_TIMEOUT: 503,
  GENERATION_FAILED: 503,
  MEDIA_UNAVAILABLE: 200,
  INTERNAL_ERROR: 500,
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            error: 'Invalid request body. Expected JSON with a "url" field.',
            code: 'INVALID_URL',
            retryable: false,
            guidance: 'Send a POST request with { "url": "https://x.com/user/status/123" }.',
          },
        },
        { status: 400 }
      );
    }

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            error: 'Missing or invalid "url" field.',
            code: 'INVALID_URL',
            retryable: false,
            guidance: 'Please provide a valid X post URL.',
          },
        },
        { status: 400 }
      );
    }

    // Run the capture pipeline
    const result = await captureTweet(body.url);

    // Build successful response
    const response: CaptureResponse = {
      success: true,
      imageBase64: result.image.toString('base64'),
      method: result.method,
      tweet: {
        id: result.tweetData.id,
        author: result.tweetData.author.name,
        username: result.tweetData.author.username,
        text: result.tweetData.text,
        createdAt: result.tweetData.createdAt,
        hasMedia: !!result.tweetData.media,
        hasMetrics: !!result.tweetData.metrics,
      },
      dimensions: {
        width: result.width,
        height: result.height,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    // Structured error from the capture pipeline
    if (err instanceof CaptureError) {
      const status = ERROR_STATUS_MAP[err.postSnapError.code] || 500;
      return NextResponse.json<ErrorResponse>(
        { success: false, error: err.postSnapError },
        { status }
      );
    }

    // Unexpected error
    console.error('[PostSnap] Unexpected error in /api/capture:', err);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          error: 'An unexpected error occurred.',
          code: 'INTERNAL_ERROR',
          retryable: true,
          guidance: 'Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
