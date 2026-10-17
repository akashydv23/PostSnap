// ============================================================================
// PostSnap — Recreation Capture via react-tweet + Puppeteer
// ============================================================================
//
// Fallback path: when the official X embed cannot be captured, render the
// tweet using react-tweet's native DOM components (no iframe) and capture
// the result with Puppeteer. Includes a disclosure overlay.
// ============================================================================

import { Page } from 'puppeteer';
import { getBrowser } from './browser-pool';
import { TweetData } from '../types';

/** Options for the recreation capture */
export interface RecreationCaptureOptions {
  tweetData: TweetData;
  theme?: 'light' | 'dark';
  timeoutMs?: number;
}

/** Result of a successful recreation capture */
export interface RecreationCaptureResult {
  image: Buffer;
  width: number;
  height: number;
}

/**
 * Format a number for display (e.g., 1200 → "1.2K").
 */
function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

/**
 * Format a date string for tweet display.
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} · ${date}`;
  } catch {
    return dateStr;
  }
}

/**
 * Build a self-contained HTML page that renders the tweet as a styled card.
 * Uses inline CSS only — no external dependencies needed.
 * Includes the recreation disclosure banner.
 */
function buildRecreationHtml(tweetData: TweetData, theme: 'light' | 'dark'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#000000' : '#ffffff';
  const fg = isDark ? '#e7e9ea' : '#0f1419';
  const muted = isDark ? '#71767b' : '#536471';
  const border = isDark ? '#2f3336' : '#cfd9de';
  const cardBg = isDark ? '#16181c' : '#ffffff';
  const linkColor = '#1d9bf0';

  // Build metrics HTML only for available values
  let metricsHtml = '';
  if (tweetData.metrics) {
    const items: string[] = [];
    if (tweetData.metrics.replies !== undefined) {
      items.push(`<span style="margin-right:20px"><span style="font-weight:700;color:${fg}">${formatCount(tweetData.metrics.replies)}</span> <span style="color:${muted}">Replies</span></span>`);
    }
    if (tweetData.metrics.retweets !== undefined) {
      items.push(`<span style="margin-right:20px"><span style="font-weight:700;color:${fg}">${formatCount(tweetData.metrics.retweets)}</span> <span style="color:${muted}">Reposts</span></span>`);
    }
    if (tweetData.metrics.likes !== undefined) {
      items.push(`<span style="margin-right:20px"><span style="font-weight:700;color:${fg}">${formatCount(tweetData.metrics.likes)}</span> <span style="color:${muted}">Likes</span></span>`);
    }
    if (tweetData.metrics.quotes !== undefined) {
      items.push(`<span><span style="font-weight:700;color:${fg}">${formatCount(tweetData.metrics.quotes)}</span> <span style="color:${muted}">Quotes</span></span>`);
    }
    if (items.length > 0) {
      metricsHtml = `
        <div style="padding:12px 0;border-top:1px solid ${border};font-size:14px;display:flex;flex-wrap:wrap">
          ${items.join('')}
        </div>
      `;
    }
  }

  // Build media HTML
  let mediaHtml = '';
  if (tweetData.media) {
    mediaHtml = `
      <div style="margin-top:12px;border-radius:16px;overflow:hidden;border:1px solid ${border}">
        <img src="${tweetData.media.url}" 
             style="width:100%;display:block;object-fit:cover;max-height:500px" 
             crossorigin="anonymous" />
      </div>
    `;
  }

  // Verified badge SVG
  const verifiedBadge = tweetData.author.verified
    ? `<svg viewBox="0 0 22 22" width="18" height="18" style="margin-left:4px;vertical-align:middle">
        <path fill="${linkColor}" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.607-.274 1.264-.144 1.897.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/>
       </svg>`
    : '';

  // X logo SVG
  const xLogo = `<svg viewBox="0 0 24 24" width="24" height="24" fill="${muted}">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${bg};
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div id="tweet-card" style="
    width: 550px;
    background: ${cardBg};
    border: 1px solid ${border};
    border-radius: 16px;
    padding: 16px;
    color: ${fg};
    font-size: 15px;
    line-height: 1.5;
    overflow: hidden;
  ">
    <!-- Header: Avatar + Author + X Logo -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center">
        <img src="${tweetData.author.avatarUrl}" 
             style="width:48px;height:48px;border-radius:50%;margin-right:12px" 
             crossorigin="anonymous" />
        <div>
          <div style="font-weight:700;font-size:15px;display:flex;align-items:center">
            ${escapeHtml(tweetData.author.name)}${verifiedBadge}
          </div>
          <div style="color:${muted};font-size:14px">@${escapeHtml(tweetData.author.username)}</div>
        </div>
      </div>
      ${xLogo}
    </div>

    <!-- Tweet Text -->
    <div style="font-size:${tweetData.isLongText ? '15px' : '17px'};line-height:1.5;white-space:pre-wrap;word-wrap:break-word;margin-bottom:12px">
      ${formatTweetText(tweetData.text, linkColor)}
    </div>

    <!-- Media -->
    ${mediaHtml}

    <!-- Timestamp -->
    <div style="padding:12px 0;color:${muted};font-size:14px;border-bottom:${tweetData.metrics ? '1px solid ' + border : 'none'}">
      ${formatDate(tweetData.createdAt)}
    </div>

    <!-- Metrics -->
    ${metricsHtml}

    <!-- Recreation Disclosure -->
    <div style="
      margin-top:12px;
      padding:8px 12px;
      background:${isDark ? '#1a1a2e' : '#fef3c7'};
      border-radius:8px;
      font-size:11px;
      color:${isDark ? '#fbbf24' : '#92400e'};
      text-align:center;
    ">
      ⚠ Recreated from available post data · PostSnap
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent injection.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format tweet text: linkify URLs, @mentions, and #hashtags.
 */
function formatTweetText(text: string, linkColor: string): string {
  let escaped = escapeHtml(text);

  // Linkify URLs
  escaped = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a style="color:${linkColor};text-decoration:none" href="$1">$1</a>`
  );

  // Linkify @mentions
  escaped = escaped.replace(
    /@(\w{1,15})/g,
    `<a style="color:${linkColor};text-decoration:none" href="https://x.com/$1">@$1</a>`
  );

  // Linkify #hashtags
  escaped = escaped.replace(
    /#(\w+)/g,
    `<a style="color:${linkColor};text-decoration:none" href="https://x.com/hashtag/$1">#$1</a>`
  );

  return escaped;
}

/**
 * Capture a tweet as a recreation PNG using inline-styled HTML + Puppeteer.
 *
 * This is the fallback when the official embed capture fails.
 * The output includes a disclosure banner: "Recreated from available post data".
 *
 * @returns RecreationCaptureResult on success, null on failure
 */
export async function captureViaRecreation(
  options: RecreationCaptureOptions
): Promise<RecreationCaptureResult | null> {
  const { tweetData, theme = 'light', timeoutMs = 10000 } = options;

  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // High DPI for sharp text
    await page.setViewport({
      width: 600,
      height: 1200,
      deviceScaleFactor: 2,
    });

    const html = buildRecreationHtml(tweetData, theme);

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: timeoutMs });

    // Wait for the card to render
    await page.waitForSelector('#tweet-card', { timeout: 5000 });

    // Wait for images to load (avatar, media)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Capture the tweet card element
    const cardElement = await page.$('#tweet-card');
    if (!cardElement) {
      console.warn('[PostSnap] Recreation card element not found');
      return null;
    }

    const boundingBox = await cardElement.boundingBox();
    if (!boundingBox || boundingBox.height < 50) {
      console.warn('[PostSnap] Recreation card too small:', boundingBox);
      return null;
    }

    const imageBuffer = await cardElement.screenshot({
      type: 'png',
    });

    const buffer = Buffer.from(imageBuffer);
    if (buffer.length < 500) {
      console.warn('[PostSnap] Recreation screenshot too small');
      return null;
    }

    return {
      image: buffer,
      width: Math.round(boundingBox.width * 2),
      height: Math.round(boundingBox.height * 2),
    };
  } catch (err) {
    console.warn(
      '[PostSnap] Recreation capture failed:',
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
