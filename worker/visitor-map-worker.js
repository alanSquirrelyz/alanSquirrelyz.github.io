// Cloudflare Worker: Visitor Map
// Deploy to: https://visitormap.alan-squirrel-acc.workers.dev/
// Requires KV namespace binding: VISITORS

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /all — return all stored visitor locations
    if (url.pathname === "/all") {
      const list = await env.VISITORS.list();
      const visitors = [];
      for (const key of list.keys) {
        const val = await env.VISITORS.get(key.name, { type: "json" });
        if (val) visitors.push(val);
      }
      return new Response(JSON.stringify(visitors), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: record visitor and return their location
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const cf = request.cf || {};

    // Use Cloudflare's built-in geolocation (no external API needed)
    const lat = parseFloat(cf.latitude) || 0;
    const lng = parseFloat(cf.longitude) || 0;
    const city = cf.city || "Unknown";
    const country = cf.country || "Unknown";

    if (lat !== 0 || lng !== 0) {
      // Hash the IP for deduplication / privacy
      const encoder = new TextEncoder();
      const data = encoder.encode(ip);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const key = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const record = { lat, lng, city, country, timestamp: Date.now() };
      // Store with 90-day expiration
      await env.VISITORS.put(key, JSON.stringify(record), {
        expirationTtl: 90 * 24 * 60 * 60,
      });
    }

    const visitor = { lat, lng, city, country };
    return new Response(JSON.stringify(visitor), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
