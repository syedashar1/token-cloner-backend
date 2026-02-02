import fetch from "node-fetch";

// =======================
// CONFIG
// =======================
const CACHE_TTL = Number(process.env.CACHE_TTL) || 10000;

const PUMP_URL =
  "https://frontend-api-v3.pump.fun/coins/for-you?offset=0&limit=100&includeNsfw=true";

// =======================
// SIMPLE CACHE (IN-MEMORY)
// =======================
let cache = null;
let lastFetch = 0;

function getCache() {
  if (!cache) return null;
  if (Date.now() - lastFetch > CACHE_TTL) return null;
  return cache;
}

function setCache(data) {
  cache = data;
  lastFetch = Date.now();
}

// =======================
// SERVERLESS HANDLER
// =======================
export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Root check
  if (req.method === "GET" && req.url === "/api/pump") {
    return res.status(200).json({
      status: "ok",
      message: "🚀 Pump.fun Proxy is running"
    });
  }

  try {
    const cached = getCache();
    if (cached) {
      return res.status(200).json({
        cached: true,
        count: cached.length || 0,
        data: cached
      });
    }

    const response = await fetch(PUMP_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Pump.fun API error",
        status: response.status
      });
    }

    const data = await response.json();
    setCache(data);

    return res.status(200).json({
      cached: false,
      count: data.length || 0,
      data
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch Pump.fun tokens",
      message: err.message
    });
  }
}
