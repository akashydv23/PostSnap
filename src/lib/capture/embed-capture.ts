// ============================================================================
// PostSnap — Official X Embed Capture via Puppeteer
// ============================================================================
//
// Primary capture path: renders the official X embed widget (widgets.js)
// inside Puppeteer and screenshots the rendered iframe card.
//
// This produces the highest fidelity output — the exact same rendering
// that X uses for embedded posts, including official typography, spacing,
// theme, engagement row, and media layout.
// ============================================================================

import { Page } from 'puppeteer';
import { getBrowser } from './browser-pool';

/** Options for the embed capture attempt */
export interface EmbedCaptureOptions {
  tweetId: string;
  theme?: 'light' | 'dark';
  timeoutMs?: number;
}

/** Result of a successful embed capture */
export interface EmbedCaptureResult {
  image: Buffer;
  width: number;
  height: number;
}

/**
 * Attempt to capture a tweet via the official X embed widget.
 *
 * 1. Creates a minimal HTML page with widgets.js
 * 2. Calls twttr.widgets.createTweet() to render the official embed
 * 3. Waits for iframe to mount and height to stabilize
 * 4. Screenshots the iframe element at 2x scale for Retina sharpness
 *
 * @returns EmbedCaptureResult on success, null on any failure (triggers fallback)
 */
export async function captureViaEmbed(
  options: EmbedCaptureOptions
): Promise<EmbedCaptureResult | null> {
  const { tweetId, theme = 'light', timeoutMs = 10000 } = options;

  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // High DPI viewport for crisp text rendering
    await page.setViewport({
      width: 700,
      height: 1200,
      deviceScaleFactor: 2,
    });

    // Minimal HTML with the official X widget loader
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 0;
              background: transparent;
              min-height: 100vh;
            }
            #container {
              width: 550px;
              max-width: 550px;
            }
          </style>
          <script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        </head>
        <body>
          <div id="container"></div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Wait for twttr to initialize, then render the tweet
    const rendered = await page.evaluate(
      async (id: string, tweetTheme: string) => {
        // Wait for twttr.widgets to be available
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('twttr init timeout')), 8000);
          const check = () => {
            if ((window as any).twttr?.widgets) {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        const container = document.getElementById('container');
        if (!container) return false;

        const el = await (window as any).twttr.widgets.createTweet(id, container, {
          theme: tweetTheme,
          conversation: 'none',
          dnt: true,
        });

        return Boolean(el);
      },
      tweetId,
      theme
    );

    if (!rendered) {
      console.warn(`[PostSnap] Embed render returned null for tweet ${tweetId}`);
      return null;
    }

    // Wait for the widget iframe to appear
    const iframeSelector = 'iframe[id^="twitter-widget-"]';
    await page.waitForSelector(iframeSelector, {
      visible: true,
      timeout: timeoutMs,
    });

    // Wait for iframe height to stabilize (dynamic resize via postMessage)
    await page.waitForFunction(
      (selector: string) => {
        const frame = document.querySelector(selector) as HTMLIFrameElement | null;
        if (!frame) return false;
        const h = frame.getBoundingClientRect().height;
        return h > 100; // Past initial placeholder height
      },
      { timeout: timeoutMs },
      iframeSelector
    );

    // Extra settle time for avatar/media images to paint
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Capture the iframe element
    const tweetElement = await page.$(iframeSelector);
    if (!tweetElement) {
      console.warn('[PostSnap] Widget iframe not found after wait');
      return null;
    }

    const boundingBox = await tweetElement.boundingBox();
    if (!boundingBox || boundingBox.width < 50 || boundingBox.height < 50) {
      console.warn('[PostSnap] Widget bounding box too small:', boundingBox);
      return null;
    }

    const imageBuffer = await tweetElement.screenshot({
      type: 'png',
      omitBackground: true,
    });

    // Validate we got actual image data
    const buffer = Buffer.from(imageBuffer);
    if (buffer.length < 1000) {
      console.warn('[PostSnap] Screenshot too small, likely empty:', buffer.length);
      return null;
    }

    return {
      image: buffer,
      width: Math.round(boundingBox.width * 2), // 2x scale factor
      height: Math.round(boundingBox.height * 2),
    };
  } catch (err) {
    console.warn(
      `[PostSnap] Embed capture failed for tweet ${tweetId}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
