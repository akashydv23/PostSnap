/**
 * Cloudflare Pages Function: GET /api/proxy-image?url=...
 * Proxies Twitter images at Cloudflare edge with Access-Control-Allow-Origin: *
 * so html2canvas can capture them with zero CORS canvas tainting.
 */

export async function onRequestGet(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url query parameter", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    return new Response("Invalid URL", { status: 400 });
  }

  const allowedHosts = ["pbs.twimg.com", "abs.twimg.com", "ton.twimg.com", "video.twimg.com", "media.twimg.com", "unavatar.io"];
  const isTwimg = parsed.hostname.toLowerCase().endsWith(".twimg.com");
  if (!allowedHosts.includes(parsed.hostname.toLowerCase()) && !isTwimg) {
    return new Response("Forbidden domain", { status: 403 });
  }

  try {
    const imgResp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://twitter.com/",
      }
    });

    if (!imgResp.ok) {
      return new Response(`Upstream error: ${imgResp.status}`, { status: imgResp.status });
    }

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Cache-Control", "public, max-age=604800, s-maxage=604800");

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    headers.set("Content-Type", contentType);

    return new Response(imgResp.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    }
  });
}
