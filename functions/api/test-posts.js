/**
 * Cloudflare Pages Function: GET /api/test-posts
 */

export async function onRequestGet() {
  return new Response(JSON.stringify({
    posts: [
      { id: "20", text: "just setting up my twttr", author: { name: "jack", username: "jack" } },
      { id: "1683920951807971329", text: "Our headquarters in San Francisco tonight", author: { name: "Elon Musk", username: "elonmusk" } },
      { id: "44196397", text: "Four more years.", author: { name: "Barack Obama", username: "BarackObama" } },
      { id: "1770000000000000001", text: "We are introducing a series of updates...", author: { name: "OpenAI", username: "OpenAI" } }
    ]
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }
  });
}
