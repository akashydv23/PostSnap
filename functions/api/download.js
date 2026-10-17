/**
 * Cloudflare Pages Function: POST /api/download
 * Receives base64 image data or handles download delivery.
 */

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const tweetId = body.tweetId || "post";
    const imageBase64 = body.imageBase64;

    if (imageBase64 && imageBase64.includes(",")) {
      const base64Data = imageBase64.split(",")[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Response(bytes.buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="PostSnap-${tweetId}.png"`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Missing imageBase64 payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
