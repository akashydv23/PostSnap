// ============================================================================
// PostSnap — /api/download Route Handler
// ============================================================================
//
// POST /api/download
// Body: { imageBase64: string, tweetId: string, method: string }
// Returns: PNG file download
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDownloadFilename } from '@/lib/disclosure';
import { GenerationMethod } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, tweetId, method } = body as {
      imageBase64?: string;
      tweetId?: string;
      method?: GenerationMethod;
    };

    if (!imageBase64 || !tweetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Validate it's a PNG (magic bytes: 89 50 4E 47)
    if (
      imageBuffer.length < 8 ||
      imageBuffer[0] !== 0x89 ||
      imageBuffer[1] !== 0x50 ||
      imageBuffer[2] !== 0x4e ||
      imageBuffer[3] !== 0x47
    ) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }

    const filename = getDownloadFilename(tweetId, method || 'captured');

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
