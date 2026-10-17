// ============================================================================
// PostSnap — Puppeteer Browser Pool (Singleton)
// ============================================================================

import puppeteer, { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

/**
 * Puppeteer launch arguments optimized for headless capture.
 */
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
  '--disable-web-security', // Allow cross-origin embed access
];

/**
 * Get or create the singleton Puppeteer browser instance.
 * Reuses a single browser across requests for performance.
 * Automatically restarts if the browser process has crashed.
 */
export async function getBrowser(): Promise<Browser> {
  // Check if existing instance is still connected
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  // Prevent race conditions — only one launch at a time
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = puppeteer
    .launch({
      headless: true,
      args: LAUNCH_ARGS,
    })
    .then((browser) => {
      browserInstance = browser;
      browserLaunchPromise = null;

      // Auto-cleanup on disconnect
      browser.on('disconnected', () => {
        browserInstance = null;
      });

      return browser;
    })
    .catch((err) => {
      browserLaunchPromise = null;
      throw err;
    });

  return browserLaunchPromise;
}

/**
 * Close the browser instance. Called during graceful shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Graceful shutdown on process exit
if (typeof process !== 'undefined') {
  const cleanup = () => {
    closeBrowser().catch(() => {});
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
